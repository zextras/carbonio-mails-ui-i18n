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
	IDatabaseChange, IDeleteChange, IUpdateChange
} from 'dexie-observable/api';
import { filter, map, reduce } from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { SoapFetch } from '@zextras/zapp-shell';
import { MailsDb, DeletionData } from './mails-db';
import {
	BatchedRequest,
	BatchRequest, BatchResponse,
	ConvActionRequest,
} from '../soap';
import { MailConversationFromDb } from './mail-conversation';


// TODO TYPE 2 UPDATING CHANGES
function processConvUpdates(
	db: MailsDb,
	changes: IUpdateChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);

	return db.conversations.where('_id').anyOf(map(changes, 'key')).toArray().then((conversations) => {
		const uuidToId = reduce<MailConversationFromDb, {[key: string]: string}>(
			conversations,
			(acc, conv) => {
				if (conv._id && conv.id) acc[conv._id] = conv.id;
				return acc;
			},
			{}
		);
		const convActionRequest: Array<BatchedRequest & ConvActionRequest> = [];
		reduce<IUpdateChange, Array<BatchedRequest & ConvActionRequest>>(
			changes,
			(acc, conv) => {
				if (conv.mods.parent) {
					if (conv.mods.parent === '2') {
						acc.push({
							_jsns: 'urn:zimbraMail',
							requestId: conv.key,
							action: {
								op: 'trash',
								id: uuidToId[conv.key],
							}
						});
					}
					else {
						acc.push({
							_jsns: 'urn:zimbraMail',
							requestId: conv.key,
							action: {
								op: 'move',
								l: conv.mods.parent,
								id: uuidToId[conv.key],
							}
						});
					}
				}
				// eslint-disable-next-line no-prototype-builtins
				if (conv.mods.hasOwnProperty('flagged')) {
					acc.push({
						_jsns: 'urn:zimbraMail',
						requestId: conv.key,
						action: {
							id: uuidToId[conv.key],
							op: (conv.mods.flagged) ? 'flag' : '!flag'
						}
					});
				}
				// eslint-disable-next-line no-prototype-builtins
				if (conv.mods.hasOwnProperty('read')) {
					acc.push({
						_jsns: 'urn:zimbraMail',
						requestId: conv.key,
						action: {
							id: uuidToId[conv.key],
							op: (conv.mods.read) ? 'read' : '!read'
						}
					});
				}
				return acc;
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
			(acc, value) => {
				// eslint-disable-next-line no-param-reassign
				acc[value._id] = { id: value.id, rowId: value.rowId! };
				return acc;
			},
			{}
		);
		const convActionRequest: Array<BatchedRequest & ConvActionRequest> = [];
		reduce(
			changes,
			(acc, change) => {
				acc.push({
					_jsns: 'urn:zimbraMail',
					requestId: change.key,
					action: {
						op: 'delete',
						id: uuidToId[change.key].id,
					}
				});
				localChanges.push({
					type: 3,
					table: 'deletions',
					key: uuidToId[change.key].rowId
				});
				return acc;
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
	_fetch: SoapFetch
): Promise<IDatabaseChange[]> {
	if (changes.length < 1) return Promise.resolve([]);

	const conversationsChanges = filter(changes, ['table', 'conversations']);
	const batchRequest: BatchRequest = {
		_jsns: 'urn:zimbra',
		onerror: 'continue'
	};

	return processConvUpdates(
		db,
		filter(conversationsChanges, ['type', 2]) as IUpdateChange[],
		batchRequest,
		changes
	)
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
			return _fetch<BatchRequest, BatchResponse>(
				'Batch',
				_batchRequest
			)
				.then(({ ConvActionRequest: convActionRequest }) => {
					if (convActionRequest) {

					}
					return _dbChanges;
				});
		});
}
