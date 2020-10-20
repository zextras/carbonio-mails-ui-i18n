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
	filter, groupBy, keyBy, keys, map, reduce, reject
} from 'lodash';
import { SoapFetch } from '@zextras/zapp-shell';
import { DeletionData, MailsDb } from './mails-db';
import {
	BatchedRequest,
	BatchedResponse,
	BatchRequest,
	BatchResponse,
	generateBodyPath,
	GetMsgRequest,
	GetMsgResponse,
	MsgActionRequest,
	normalizeDraftToSoap,
	normalizeMailMessageFromSoap,
	SaveDraftRequest,
	SaveDraftResponse,
	SendMsgRequest,
	SendMsgResponse
} from '../soap';
import { MailMessageFromDb } from './mail-message';

function processSaveDrafts(
	db: MailsDb,
	[batchRequest, localChanges, drafts]: ChainData
): Promise<ChainData> {
	const saveDraftRequest = reduce<MailMessageFromDb, Array<BatchedRequest & SaveDraftRequest>>(
		reject(drafts, 'send'),
		(acc, msg) => {
			acc.push({
				_jsns: 'urn:zimbraMail',
				requestId: msg._id,
				m: normalizeDraftToSoap(msg, false)
			});
			return acc;
		},
		[]
	);
	if (saveDraftRequest.length > 0) {
		// eslint-disable-next-line no-param-reassign
		batchRequest.SaveDraftRequest = [
			...(batchRequest.SaveDraftRequest || []),
			...saveDraftRequest
		];
	}
	const sendMsgRequest = reduce<MailMessageFromDb, Array<BatchedRequest & SendMsgRequest>>(
		filter(drafts, 'send'),
		(acc, msg) => {
			acc.push({
				_jsns: 'urn:zimbraMail',
				requestId: msg._id,
				m: normalizeDraftToSoap(msg, true)
			});
			return acc;
		},
		[]
	);
	if (sendMsgRequest.length > 0) {
		// eslint-disable-next-line no-param-reassign
		batchRequest.SendMsgRequest = [
			...(batchRequest.SendMsgRequest || []),
			...sendMsgRequest
		];
	}
	return Promise.resolve([
		batchRequest,
		localChanges,
		drafts
	]);
}

function processInserts(
	db: MailsDb,
	changes: ICreateChange[],
	[batchRequest, localChanges, drafts]: ChainData
): Promise<ChainData> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges, drafts]);
	return db.messages.where('_id').anyOf(
		map(
			filter(changes, (c) => c.obj.parent === '6' && typeof c.obj.id === 'undefined'),
			'key'
		)
	)
		.toArray()
		.then(
			(createdDrafts: MailMessageFromDb[]) => [
				batchRequest,
				localChanges,
				[...drafts, ...createdDrafts]
			]
		);
}

function processCreationResponse(response: BatchedResponse & SaveDraftResponse): IUpdateChange {
	return {
		type: 2,
		table: 'messages',
		key: response.requestId,
		mods: {
			id: response.m[0].id,
			conversation: response.m[0].cid,
			date: response.m[0].d,
			bodyPath: generateBodyPath(response.m[0].mp)
		}
	};
}

function processSendResponses(
	responses: Array<BatchedResponse & SendMsgResponse>,
	_fetch: SoapFetch
): Promise<IUpdateChange[]> {
	if (responses.length < 1) return Promise.resolve([]);
	const batchRequest: BatchRequest = {
		_jsns: 'urn:zimbra',
		onerror: 'continue'
	};
	batchRequest.GetMsgRequest = reduce<BatchedResponse & SendMsgResponse,
		Array<BatchedRequest & GetMsgRequest>>(
			responses,
			(acc, sendMsgResp): Array<BatchedRequest & GetMsgRequest> => {
				acc.push({
					_jsns: 'urn:zimbraMail',
					requestId: sendMsgResp.requestId,
					m: [{ id: sendMsgResp.m[0].id, html: '1' }]
				});
				return acc;
			},
			[]
		);
	return _fetch<BatchRequest, BatchResponse>(
		'Batch',
		batchRequest
	)
		.then(({ GetMsgResponse: getMsgResponse }) =>
			reduce<BatchedResponse & GetMsgResponse, IUpdateChange[]>(
				getMsgResponse || [],
				(acc, { m, requestId }) => {
					acc.push({
						type: 2,
						table: 'messages',
						key: requestId,
						mods: normalizeMailMessageFromSoap(m[0])
					});
					return acc;
				},
				[]
			));
}

function processMailUpdates(
	db: MailsDb,
	changes: IUpdateChange[],
	[batchRequest, localChanges, drafts]: ChainData
): Promise<ChainData> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges, drafts]);
	return db.messages.where('_id').anyOf(map(changes, 'key')).toArray()
		.then((messagesArray: MailMessageFromDb[]) => keyBy(messagesArray, '_id'))
		.then((messages: { [key: string]: MailMessageFromDb }) => {
			const editedDrafts: MailMessageFromDb[] = [];
			const msgActionRequest = reduce<IUpdateChange, Array<BatchedRequest & MsgActionRequest>>(
				changes,
				(_msgActionRequest, change) => {
					if (messages[change.key].parent === '6') {
						editedDrafts.push(messages[change.key]);
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
									id
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
									id
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
				batchRequest.MsgActionRequest = [
					...(batchRequest.MsgActionRequest || []),
					...msgActionRequest
				];
			}

			return [batchRequest, localChanges, [...drafts, ...editedDrafts]];
		});
}

function processDeletions(
	db: MailsDb,
	_keys: string[],
	[batchRequest, localChanges, drafts]: ChainData
): Promise<ChainData> {
	if (_keys.length < 1) return Promise.resolve([batchRequest, localChanges, drafts]);
	return db.deletions.where('_id').anyOf(_keys).toArray().then((deletedIds) => {
		const uuidToId = reduce<DeletionData, { [key: string]: { id: string; rowId: string } }>(
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
						id: uuidToId[key].id
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
			batchRequest.MsgActionRequest = [
				...(batchRequest.MsgActionRequest || []),
				...msgActionRequest
			];
		}
		return Promise.resolve([batchRequest, localChanges, drafts]);
	});
}

type ChainData = [BatchRequest, IDatabaseChange[], MailMessageFromDb[]];

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

	return processDeletions(
		db,
		keys(groupBy(filter(messagesChanges, ['type', 3]) as IDeleteChange[], 'key')),
		[batchRequest, [], []]
	)
		.then((cd: ChainData) => processInserts(
			db,
			filter(messagesChanges, ['type', 1]) as ICreateChange[],
			cd
		))
		.then((cd: ChainData) => processMailUpdates(
			db,
			filter(messagesChanges, ['type', 2]) as IUpdateChange[],
			cd
		))
		.then((cd: ChainData) => processSaveDrafts(
			db,
			cd
		))
		.then(([_batchRequest, _dbChanges]) => {
			if (!_batchRequest.MsgActionRequest
				&& !_batchRequest.SaveDraftRequest
				&& !_batchRequest.SendMsgRequest) {
				return _dbChanges;
			}
			return _fetch<BatchRequest, BatchResponse>(
				'Batch',
				_batchRequest
			)
				.then((batchResponse: BatchResponse) => {
					if (batchResponse.SendMsgResponse) {
						return processSendResponses(batchResponse.SendMsgResponse, _fetch)
							.then((sendMailChanges) => {
								_dbChanges.unshift(...sendMailChanges);
								return batchResponse;
							});
					}
					return Promise.resolve(batchResponse);
				})
				.then(({
					SaveDraftResponse: saveDraftResponse
				}) => {
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
