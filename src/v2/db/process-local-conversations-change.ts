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
	ConvActionRequest,
	ConvActionResponse,
} from '../soap';
import { MailConversationMessage } from './mail-conversation-message';

// TODO TYPE 1 CREATING INSERTS
function processInserts(
	db: MailsDb,
	changes: ICreateChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);
	const convActionRequest: Array<BatchedRequest & ConvActionRequest> = [];
	reduce<ICreateChange, Array<BatchedRequest & ConvActionRequest>>(
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
		convActionRequest
	);
	if (convActionRequest.length > 0) {
		batchRequest.ConvActionRequest = [
			...(batchRequest.ConvActionRequest || []),
			...convActionRequest
		];
	}
	return Promise.resolve([batchRequest, localChanges]);
}

// TODO PROCESS CREATION (creating a draft)

function processCreationResponse(r: BatchedResponse & ConvActionResponse): IUpdateChange {
	const conversation = r.action;
	return {
		type: 2,
		table: 'conversations',
		key: r.requestId,
		mods: {
			id: conversation.id // TODO is this right?
		}
	};
}

// TODO TYPE 2 UPDATING CHANGES
function processConvUpdates(
	db: MailsDb,
	changes: IUpdateChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);

	return db.conversations.where('_id').anyOf(map(changes, 'key')).toArray().then((conversations) => {
		const uuidToId = reduce<MailConversationMessage, {[key: string]: string}>(
			conversations,
			(r, f) => {
				if (f._id && f.id) r[f._id] = f.id;
				return r;
			},
			{}
		);
		const convActionRequest: Array<BatchedRequest & ConvActionRequest> = [];
		reduce<IUpdateChange, [Array<BatchedRequest & ConvActionRequest>]>(
			changes,
			([_convActionRequest], c) => {
				if (c.mods.parent) {
					if (c.mods.parent === '2') {
						_convActionRequest.push({
							_jsns: 'urn:zimbraMail',
							requestId: c.key,
							action: {
								op: 'trash',
								id: uuidToId[c.key],
							}
						});
					}
					else {
						_convActionRequest.push({
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
					_convActionRequest.push({
						_jsns: 'urn:zimbraMail',
						requestId: c.key,
						action: {
							id: uuidToId[c.key],
							op: (c.mods.flagged) ? 'flag' : '!flag'
						}
					});
				}
				if (c.mods.hasOwnProperty('read')) {
					_convActionRequest.push({
						_jsns: 'urn:zimbraMail',
						requestId: c.key,
						action: {
							id: uuidToId[c.key],
							op: (c.mods.read) ? 'read' : '!read'
						}
					});
				}
				return [_convActionRequest];
			},
			[convActionRequest]
		);

		if (convActionRequest.length > 0) {
			batchRequest.ConvActionRequest =	[
				...(batchRequest.ConvActionRequest || []),
				...convActionRequest
			];
		}

		return [batchRequest, localChanges];
	});
}

// TODO TYPE 3 DELETING CHANGES
function processConvDeletions(
	db: MailsDb,
	changes: IDeleteChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);
	return db.deletions.where('_id').anyOf(map(changes, 'key')).toArray().then((deletedIds) => {
		const uuidToId = reduce<DeletionData, {[key: string]: {id: string; rowId: string}}>(
			filter(deletedIds, ['table', 'conversations']),
			(r, d) => {
				// eslint-disable-next-line no-param-reassign
				r[d._id] = { id: d.id, rowId: d.rowId! };
				return r;
			},
			{}
		);
		const convActionRequest: Array<BatchedRequest & ConvActionRequest> = [];
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
			convActionRequest
		);
		if (convActionRequest.length > 0) {
			// eslint-disable-next-line no-param-reassign
			batchRequest.ConvActionRequest =	[
				...(batchRequest.ConvActionRequest || []),
				...convActionRequest
			];
		}
		return Promise.resolve([batchRequest, localChanges]);
	});
}

// TODO PROCESSING THE LOCAL MAIL CHANGES
export default function processLocalConvChange(
	db: MailsDb,
	changes: IDatabaseChange[],
	_fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
): Promise<IDatabaseChange[]> {
	if (changes.length < 1) return Promise.resolve([]);

	const conversationsChanges = filter(changes, ['table', 'conversations']);
	const batchRequest: BatchRequest = {
		_jsns: 'urn:zimbra',
		onerror: 'continue'
	};

	return processInserts(
		db,
		filter(conversationsChanges, ['type', 1]) as ICreateChange[],
		batchRequest,
		[]
	)
		.then(([_batchRequest, _dbChanges]) => processConvUpdates(
			db,
			filter(conversationsChanges, ['type', 2]) as IUpdateChange[],
			_batchRequest,
			_dbChanges
		))
		.then(([_batchRequest, _dbChanges]) => processConvDeletions(
			db,
			filter(conversationsChanges, ['type', 3]) as IDeleteChange[],
			_batchRequest,
			_dbChanges
		))
		.then(([_batchRequest, _dbChanges]) => {
			if (!_batchRequest.ConvActionRequest) {
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
					if (BatchResponse.ConvActionRequest) { // TODO needed for drafts
						// const creationChanges = reduce<any, IUpdateChange[]>(
						// 	BatchResponse.ConvActionRequest,
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
