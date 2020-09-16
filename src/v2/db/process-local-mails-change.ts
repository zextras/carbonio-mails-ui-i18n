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
import {
	filter, map, reduce, keyBy, pullAll, keys, groupBy, pullAllWith
} from 'lodash';

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { SoapFetch } from '@zextras/zapp-shell';
import { MailsDb, DeletionData } from './mails-db';
import {
	BatchedRequest, BatchedResponse,
	BatchRequest, BatchResponse,
	MsgActionRequest, normalizeDraftToSoap,
	SaveDraftRequest, SaveDraftResponse
} from '../soap';
import { MailMessageFromDb } from './mail-message';

function processInserts(
	db: MailsDb,
	changes: ICreateChange[],
	[batchRequest, localChanges]: ChainData,
): Promise<ChainData> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);
	return Promise.resolve([batchRequest, localChanges]);
}

function processCreationResponse(response: BatchedResponse & SaveDraftResponse): IUpdateChange {
	return {
		type: 2,
		table: 'messages',
		key: response.requestId,
		mods: {
			id: response.m[0].id,
			conversation: response.m[0].cid,
			date: response.m[0].d
		}
	};
}

function processMailUpdates(
	db: MailsDb,
	changes: IUpdateChange[],
	[batchRequest, localChanges]: ChainData,
): Promise<ChainData> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);
	return db.messages.where('_id').anyOf(map(changes, 'key')).toArray()
		.then((messagesArray: MailMessageFromDb[]) => keyBy(messagesArray, '_id'))
		.then((messages: {[key: string]: MailMessageFromDb}) => {
			const msgActionRequest = reduce<IUpdateChange, Array<BatchedRequest & MsgActionRequest>>(
				changes,
				(_msgActionRequest, change) => {
					if (messages[change.key].parent === '6') {
						return _msgActionRequest;
					}
					const id = messages[change.key].id as string;
					if (change.mods.parent) {
						if (change.mods.parent === '2') {
							_msgActionRequest.push({
								_jsns: 'urn:zimbraMail',
								requestId: change.key,
								action: {
									op: 'trash',
									id,
								}
							});
						}
						else {
							_msgActionRequest.push({
								_jsns: 'urn:zimbraMail',
								requestId: change.key,
								action: {
									op: 'move',
									l: change.mods.parent,
									id,
								}
							});
						}
					}
					// eslint-disable-next-line no-prototype-builtins
					if (change.mods.hasOwnProperty('flagged')) {
						_msgActionRequest.push({
							_jsns: 'urn:zimbraMail',
							requestId: change.key,
							action: {
								id,
								op: (change.mods.flagged) ? 'flag' : '!flag'
							}
						});
					}
					// eslint-disable-next-line no-prototype-builtins
					if (change.mods.hasOwnProperty('read')) {
						_msgActionRequest.push({
							_jsns: 'urn:zimbraMail',
							requestId: change.key,
							action: {
								id,
								op: (change.mods.read) ? 'read' : '!read'
							}
						});
					}
					return _msgActionRequest;
				},
				[]
			);

			if (msgActionRequest.length > 0) {
				// eslint-disable-next-line no-param-reassign
				batchRequest.MsgActionRequest =	[
					...(batchRequest.MsgActionRequest || []),
					...msgActionRequest
				];
			}

			return [batchRequest, localChanges];
		});
}

function processDeletions(
	db: MailsDb,
	_keys: string[],
	[batchRequest, localChanges]: ChainData,
): Promise<ChainData> {
	if (_keys.length < 1) return Promise.resolve([batchRequest, localChanges]);
	return db.deletions.where('_id').anyOf(_keys).toArray().then((deletedIds) => {
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
			_keys,
			(acc, key) => {
				acc.push({
					_jsns: 'urn:zimbraMail',
					requestId: key,
					action: {
						op: 'delete',
						id: uuidToId[key].id,
					}
				});
				localChanges.push({
					type: 3,
					table: 'deletions',
					key: uuidToId[key].rowId
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

function processSaveDrafts(
	db: MailsDb,
	ids: string[],
	[batchRequest, localChanges]: ChainData,
): Promise<ChainData> {
	return db.messages
		.bulkGet(ids)
		.then((msgs) => {
			const saveDraftRequest: Array<BatchedRequest & SaveDraftRequest> = [];
			reduce<MailMessageFromDb, Array<BatchedRequest & SaveDraftRequest>>(
				msgs,
				(acc, msg) => {
					acc.push({
						_jsns: 'urn:zimbraMail',
						requestId: msg._id,
						m: normalizeDraftToSoap(msg)
					});
					return acc;
				},
				saveDraftRequest
			);
			if (saveDraftRequest.length > 0) {
				// eslint-disable-next-line no-param-reassign
				batchRequest.SaveDraftRequest = [
					...(batchRequest.SaveDraftRequest || []),
					...saveDraftRequest
				];
			}
			return [batchRequest, localChanges];
		});
}

type ChainData = [BatchRequest, IDatabaseChange[]];

export default function processLocalMailsChange(
	db: MailsDb,
	changes: IDatabaseChange[],
	_fetch: SoapFetch
): Promise<IDatabaseChange[]> {
	if (changes.length < 1) return Promise.resolve([]);

	const messagesChanges = filter(changes, ['table', 'messages']);
	const batchRequest: BatchRequest = {
		_jsns: 'urn:zimbra',
		onerror: 'continue'
	};

	const draftsChanges: IDatabaseChange[] = [
		...filter(
			filter(messagesChanges, ['type', 1]) as ICreateChange[],
			['obj.parent', '6']
		),
		...filter(
			filter(messagesChanges, ['type', 2]) as ICreateChange[],
			['mods.parent', '6']
		),
	];
	const deletedMessages = keys(
		groupBy(
			filter(messagesChanges, ['type', 3]) as IDeleteChange[],
			'key'
		)
	);
	const draftIds = keys(
		groupBy(
			draftsChanges,
			'key'
		)
	);
	pullAll(draftIds, deletedMessages);
	pullAllWith(messagesChanges, [...draftIds, ...deletedMessages], (a, b) => (a.key === b));

	return processDeletions(
		db,
		deletedMessages,
		[batchRequest, []]
	)
		.then((cd) => processSaveDrafts(
			db,
			draftIds,
			cd
		))
		.then((cd) => processInserts(
			db,
			filter(messagesChanges, ['type', 1]) as ICreateChange[],
			cd
		))
		.then((cd) => processMailUpdates(
			db,
			filter(messagesChanges, ['type', 2]) as IUpdateChange[],
			cd
		))
		.then(([_batchRequest, _dbChanges]) => {
			if (!_batchRequest.MsgActionRequest && !_batchRequest.SaveDraftRequest) {
				return _dbChanges;
			}
			return _fetch<BatchRequest, BatchResponse>(
				'Batch',
				_batchRequest
			)
				.then(({ SaveDraftResponse: saveDraftResponse }) => {
					if (saveDraftResponse) {
						const creationChanges = reduce<BatchedResponse & SaveDraftResponse, IUpdateChange[]>(
							saveDraftResponse,
							(acc, response) => {
								acc.push(processCreationResponse(response));
								return acc;
							},
							[]
						);
						_dbChanges.unshift(...creationChanges);
					}
					return _dbChanges;
				});
		});
}
