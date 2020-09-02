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
	BatchRequest,
	MsgActionRequest,
	MsgActionResponse,
} from '../soap';
import { MailMessageFromDb } from './mail-message';


// TODO TYPE 1 CREATING INSERTS
function processInserts(
	db: MailsDb,
	changes: ICreateChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);
	const msgActionRequest: Array<BatchedRequest & MsgActionRequest> = [];
	reduce<ICreateChange, Array<BatchedRequest & MsgActionRequest>>(
		changes,
		(r, c) => {
			r.push({
				_jsns: 'urn:zimbraMail',
				requestId: c.key,
				action: {
					id: '1000',
					op: '',
				},
			});
			return r;
		},
		msgActionRequest
	);
	if (msgActionRequest.length > 0) {
		batchRequest.MsgActionRequest = [
			...(batchRequest.MsgActionRequest || []),
			...msgActionRequest
		];
	}
	return Promise.resolve([batchRequest, localChanges]);
}

// TODO PROCESS CREATION (creating a draft)

function processCreationResponse(r: BatchedResponse & MsgActionResponse): IUpdateChange {
	const message = r.action;
	return {
		type: 2,
		table: 'messages',
		key: r.requestId,
		mods: {
			id: message.id // TODO is this right?
		}
	};
}

// TODO TYPE 2 UPDATING CHANGES
function processMailUpdates(
	db: MailsDb,
	changes: IUpdateChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);

	return db.messages.where('_id').anyOf(map(changes, 'key')).toArray().then((messages) => {
		const uuidToId = reduce<MailMessageFromDb, {[key: string]: string}>(
			messages,
			(r, f) => {
				if (f._id && f.id) r[f._id] = f.id;
				return r;
			},
			{}
		);
		const msgActionRequest: Array<BatchedRequest & MsgActionRequest> = [];
		reduce<IUpdateChange, [Array<BatchedRequest & MsgActionRequest>]>(
			changes,
			([_msgActionRequest], c) => {
				if (c.mods.parent) {
					if (c.mods.parent === '2') {
						_msgActionRequest.push({
							_jsns: 'urn:zimbraMail',
							requestId: c.key,
							action: {
								op: 'trash',
								id: uuidToId[c.key],
							}
						});
					}
					else {
						_msgActionRequest.push({
							_jsns: 'urn:zimbraMail',
							requestId: c.key,
							action: {
								op: 'move',
								l: c.mods.parent,
								id: uuidToId[c.key],
							}
						});
					}
				}
				if (c.mods.hasOwnProperty('flagged')) {
					_msgActionRequest.push({
						_jsns: 'urn:zimbraMail',
						requestId: c.key,
						action: {
							id: uuidToId[c.key],
							op: (c.mods.flagged) ? 'flag' : '!flag'
						}
					});
				}
				if (c.mods.hasOwnProperty('read')) {
					_msgActionRequest.push({
						_jsns: 'urn:zimbraMail',
						requestId: c.key,
						action: {
							id: uuidToId[c.key],
							op: (c.mods.read) ? 'read' : '!read'
						}
					});
				}
				return [_msgActionRequest];
			},
			[msgActionRequest]
		);

		if (msgActionRequest.length > 0) {
			batchRequest.MsgActionRequest =	[
				...(batchRequest.MsgActionRequest || []),
				...msgActionRequest
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
		const msgActionRequest: Array<BatchedRequest & MsgActionRequest> = [];
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
			msgActionRequest
		);
		if (msgActionRequest.length > 0) {
			// eslint-disable-next-line no-param-reassign
			batchRequest.MsgActionRequest =	[
				...(batchRequest.MsgActionRequest || []),
				...msgActionRequest
			];
		}
		return Promise.resolve([batchRequest, localChanges]);
	});
}

// TODO PROCESSING THE LOCAL MAIL CHANGES
export default function processLocalMailsChange(
	db: MailsDb,
	changes: IDatabaseChange[],
	_fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
): Promise<IDatabaseChange[]> {
	if (changes.length < 1) return Promise.resolve([]);

	const messagesChanges = filter(changes, ['table', 'messages']);
	const batchRequest: BatchRequest = {
		_jsns: 'urn:zimbra',
		onerror: 'continue'
	};

	return processInserts(
		db,
				filter(messagesChanges, ['type', 1]) as ICreateChange[],
				batchRequest,
				[]
	)
		.then(([_batchRequest, _dbChanges]) => processMailUpdates(
			db,
			filter(messagesChanges, ['type', 2]) as IUpdateChange[],
			_batchRequest,
			_dbChanges
		))
		.then(([_batchRequest, _dbChanges]) => processDeletions(
			db,
			filter(messagesChanges, ['type', 3]) as IDeleteChange[],
			_batchRequest,
			_dbChanges
		))
		.then(([_batchRequest, _dbChanges]) => {
			if (!_batchRequest.MsgActionRequest) {
				return _dbChanges;
			}
			return _fetch(
				'/service/soap/BatchRequest',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
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
					if (BatchResponse.MsgActionResponse) { // TODO needed for drafts
						// const creationChanges = reduce<any, IUpdateChange[]>(
						// 	BatchResponse.MsgActionResponse,
						// 	(r, response) => {
						// 		r.push(processCreationResponse(response));
						// 		return r;
						// 	},
						// 	[]
						// );
						// _dbChanges.unshift(...creationChanges);
					}
					return _dbChanges;
				});
		});
}
