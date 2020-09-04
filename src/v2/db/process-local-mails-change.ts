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
	MsgActionResponse, SaveDraftRequest, SaveDraftResponse
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
	const saveDraftRequest: Array<BatchedRequest & SaveDraftRequest> = [];
	reduce<ICreateChange, Array<BatchedRequest & SaveDraftRequest>>(
		changes,
		(acc, change) => {
			console.log(change);
			acc.push({
				_jsns: 'urn:zimbraMail',
				requestId: change.key,
				m: {
					su: change.obj.subject,
					f: `${
						change.obj.read ? '' : 'u'
					}${
						change.obj.flag ? 'f' : ''
					}${
						change.obj.urgent ? '!' : ''
					}${
						change.obj.attachment ? 'a' : ''
					}`,
					mp: change.obj.parts,
					e: []
				}
			});
			return acc;
		},
		saveDraftRequest
	);
	if (saveDraftRequest.length > 0) {
		batchRequest.SendMailRequest = [
			...(batchRequest.SendMailRequest || []),
			...saveDraftRequest
		];
	}
	return Promise.resolve([batchRequest, localChanges]);
}

// TODO PROCESS CREATION (creating a draft)

function processCreationResponse(r: BatchedResponse & SaveDraftResponse): IUpdateChange {
	return {
		type: 2,
		table: 'messages',
		key: r.requestId,
		mods: {
			id: r.m[0].id,
			conversation: r.m[0].cid,
			date: r.m[0].d
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
			(acc, value) => {
				if (value._id && value.id) acc[value._id] = value.id;
				return acc;
			},
			{}
		);
		const msgActionRequest: Array<BatchedRequest & MsgActionRequest> = [];
		reduce<IUpdateChange, [Array<BatchedRequest & MsgActionRequest>]>(
			changes,
			([_msgActionRequest], value) => {
				if (value.mods.parent) {
					if (value.mods.parent === '2') {
						_msgActionRequest.push({
							_jsns: 'urn:zimbraMail',
							requestId: value.key,
							action: {
								op: 'trash',
								id: uuidToId[value.key],
							}
						});
					}
					else {
						_msgActionRequest.push({
							_jsns: 'urn:zimbraMail',
							requestId: value.key,
							action: {
								op: 'move',
								l: value.mods.parent,
								id: uuidToId[value.key],
							}
						});
					}
				}
				if (value.mods.hasOwnProperty('flagged')) {
					_msgActionRequest.push({
						_jsns: 'urn:zimbraMail',
						requestId: value.key,
						action: {
							id: uuidToId[value.key],
							op: (value.mods.flagged) ? 'flag' : '!flag'
						}
					});
				}
				if (value.mods.hasOwnProperty('read')) {
					_msgActionRequest.push({
						_jsns: 'urn:zimbraMail',
						requestId: value.key,
						action: {
							id: uuidToId[value.key],
							op: (value.mods.read) ? 'read' : '!read'
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
			(acc, value) => {
				// eslint-disable-next-line no-param-reassign
				acc[value._id] = { id: value.id, rowId: value.rowId! };
				return acc;
			},
			{}
		);
		const msgActionRequest: Array<BatchedRequest & MsgActionRequest> = [];
		reduce(
			changes,
			(acc, value) => {
				acc.push({
					_jsns: 'urn:zimbraMail',
					requestId: value.key,
					action: {
						op: 'delete',
						id: uuidToId[value.key].id,
					}
				});
				localChanges.push({
					type: 3,
					table: 'deletions',
					key: uuidToId[value.key].rowId
				});
				return acc;
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
