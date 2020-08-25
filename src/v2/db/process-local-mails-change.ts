/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import {
	ICreateChange, IDatabaseChange, IDeleteChange, IUpdateChange
} from 'dexie-observable/api';
import { filter, map, reduce } from 'lodash';
import { MailsDb, DeletionData } from './mails-db';
import {
	BatchedRequest, BatchedResponse,
	BatchRequest, MailActionRequest,
	CreateMailRequest,
	CreateMailResponse,
	ModifyMailRequest,
} from '../soap';

// TODO TYPE 1 INSERTING CHANGES

function processMailInserts(
	db: MailsDb,
	changes: ICreateChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);
	const createMailRequest: Array<BatchedRequest & CreateMailRequest> = [];
	reduce<ICreateChange, Array<BatchedRequest & CreateMailRequest>>(
		changes,
		(r, c) => {
			r.push({
				_jsns: 'urn:zimbraMail',
				requestId: c.key,
			});
			return r;
		},
		createMailRequest
	);
	if (createMailRequest.length > 0) {
		// eslint-disable-next-line no-param-reassign
		batchRequest.CreateMailRequest = [
			...(batchRequest.CreateMailRequest || []),
			...createMailRequest
		];
	}
	return Promise.resolve([batchRequest, localChanges]);
}

// TODO TYPE 2 UPDATING CHANGES

function processMailUpdates(
	db: MailsDb,
	changes: IUpdateChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);

	return db.messages.where('_id').anyOf(map(changes, 'key')).toArray().then((mails) => {
		const uuidToId = reduce<MailsDb, {[key: string]: string}>(
			mails,
			(r: { [x: string]: any }, f: { _id: string | number; id: string }) => {
				if (f._id && f.id) r[f._id] = f.id;
				return r;
			},
			{}
		);
		const modifyMailRequest: Array<BatchedRequest & ModifyMailRequest> = [];
		const moveMailRequest: Array<BatchedRequest & MailActionRequest> = [];
		// eslint-disable-next-line max-len
		reduce<IUpdateChange, [Array<BatchedRequest & ModifyMailRequest>, Array<BatchedRequest & MailActionRequest>]>(
			changes,
			([_modifyMailRequest, _moveMailRequest], c) => {
				if (c.mods.parent) {
					_moveMailRequest.push({
						_jsns: 'urn:zimbraMail',
						requestId: c.key,
						action: {
							op: 'move',
							id: uuidToId[c.key],
						},
					});
				}
				else {
					_modifyMailRequest.push({
						_jsns: 'urn:zimbraMail',
						requestId: c.key,
					});
				}
				return [_modifyMailRequest, _moveMailRequest];
			},
			[modifyMailRequest, moveMailRequest]
		);

		if (modifyMailRequest.length > 0) {
			// eslint-disable-next-line no-param-reassign
			batchRequest.ModifyMailRequest =	[
				...(batchRequest.ModifyMailRequest || []),
				...modifyMailRequest
			];
		}
		if (moveMailRequest.length > 0) {
			// eslint-disable-next-line no-param-reassign
			batchRequest.MailActionRequest =	[
				...(batchRequest.MailActionRequest || []),
				...moveMailRequest
			];
		}

		return [batchRequest, localChanges];
	});
}

// TODO TYPE 3 DELETING CHANGES
function processDeletions(
	db: MailsDb,
	changes: IDeleteChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);
	return db.deletions.where('_id').anyOf(map(changes, 'key')).toArray().then((deletedIds) => {
		const uuidToId = reduce<DeletionData, {[key: string]: {id: string; rowId: string}}>(
			filter(deletedIds, ['table', 'messages']),
			(r, d) => {
				// eslint-disable-next-line no-param-reassign
				r[d._id] = { id: d.id, rowId: d.rowId! };
				return r;
			},
			{}
		);
		const mailsActionRequest: Array<BatchedRequest & MailActionRequest> = [];
		reduce(
			changes,
			(r, c) => {
				r.push({
					_jsns: 'urn:zimbraMail',
					requestId: c.key,
					action: {
						op: 'delete',
						id: uuidToId[c.key].id,
					}
				});
				localChanges.push({
					type: 3,
					table: 'deletions',
					key: uuidToId[c.key].rowId
				});
				return r;
			},
			mailsActionRequest
		);
		if (mailsActionRequest.length > 0) {
			// eslint-disable-next-line no-param-reassign
			batchRequest.MailActionRequest =	[
				...(batchRequest.MailActionRequest || []),
				...mailsActionRequest
			];
		}
		return Promise.resolve([batchRequest, localChanges]);
	});
}

// TODO PROCESS CREATION

function processCreationResponse(r: BatchedResponse & CreateMailResponse): IUpdateChange {
	const folder = r.cn[0];
	return {
		type: 2,
		table: 'messages',
		key: r.requestId,
		mods: {
			id: folder.id
		}
	};
}

// TODO PROCESS THE LOCAL MAIL CHANGES

export default function processLocalMailsChange(
	db: MailsDb,
	changes: IDatabaseChange[],
	_fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
): Promise<IDatabaseChange[]> {
	if (changes.length < 1) return Promise.resolve([]);

	const mailChanges = filter(changes, ['table', 'messages']);
	const batchRequest: BatchRequest = {
		_jsns: 'urn:zimbra',
		onerror: 'continue'
	};

	return processMailInserts(
		db,
		filter(mailChanges, ['type', 1]) as ICreateChange[],
		batchRequest,
		[]
	).then(([_batchRequest, _dbChanges]) => processMailUpdates(
		db,
		filter(mailChanges, ['type', 2]) as IUpdateChange[],
		_batchRequest,
		_dbChanges
	))
		.then(([_batchRequest, _dbChanges]) => processDeletions(
			db,
			filter(mailChanges, ['type', 3]) as IDeleteChange[],
			_batchRequest,
			_dbChanges
		))
		.then(([_batchRequest, _dbChanges]) => {
			if (
				!_batchRequest.CreateMailRequest
				&& !_batchRequest.ModifyMailRequest
				&& !_batchRequest.MailActionRequest
			) {
				return _dbChanges;
			}
			return _fetch(
				'/service/soap/BatchRequest',
				{
					method: 'POST',
					body: JSON.stringify({
						Body: {
							BatchRequest: _batchRequest
						}
					})
				}
			)
				.then((response) => response.json())
				.then((r) => {
					if (r.Body.Fault) throw new Error(r.Body.Fault.Reason.Text);
					else return r.Body.BatchResponse;
				})
				.then((BatchResponse) => {
					if (BatchResponse.CreateMailResponse) {
						const creationChanges = reduce<any, IUpdateChange[]>(
							BatchResponse.CreateMailResponse,
							(r, response) => {
								r.push(processCreationResponse(response));
								return r;
							},
							[]
						);
						_dbChanges.unshift(...creationChanges);
					}
					return _dbChanges;
				});
		});
}
