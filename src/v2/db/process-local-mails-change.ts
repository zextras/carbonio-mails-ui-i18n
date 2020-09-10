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
	filter, map, reduce, keyBy
} from 'lodash';
import { SoapFetch } from '@zextras/zapp-shell';
import { MailsDb, DeletionData } from './mails-db';
import {
	BatchedRequest, BatchedResponse,
	BatchRequest, BatchResponse,
	MsgActionRequest,
	SaveDraftRequest, SaveDraftResponse
} from '../soap';
import { MailMessageFromDb, MailMessagePart } from './mail-message';
import { Participant } from './mail-db-types';

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
		// eslint-disable-next-line no-param-reassign
		batchRequest.SendMailRequest = [
			...(batchRequest.SendMailRequest || []),
			...saveDraftRequest
		];
	}
	return Promise.resolve([batchRequest, localChanges]);
}

// TODO PROCESS CREATION (creating a draft)

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

// TODO TYPE 2 UPDATING CHANGES
function processMailUpdates(
	db: MailsDb,
	changes: IUpdateChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
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

			const saveDraftRequest = reduce<IUpdateChange, Array<BatchedRequest & SaveDraftRequest>>(
				changes,
				(_saveDraftRequest, change) => {
					if (messages[change.key].parent === '6') {
						return _saveDraftRequest;
					}
					_saveDraftRequest.push(
						{
							_jsns: 'urn:zimbraMail',
							requestId: change.key,
							m: {
								id: messages[change.key].id,
								su: change.mods.subject || messages[change.key].subject,
								f: `${
									messages[change.key].read ? '' : 'u'
								}${
									messages[change.key].flagged ? 'f' : ''
								}${
									messages[change.key].urgent ? '!' : ''
								}${
									messages[change.key].attachment ? 'a' : ''
								}`,
								mp: [
									{
										ct: 'multipart/alternative',
										mp: map(
											messages[change.key].parts,
											(part: Partial<MailMessagePart>) => ({
												ct: part.contentType,
												content: part.content,
											})
										)
									}
								],
								e: [
									...map(
										messages[change.key].contacts,
										(contact: Participant) => ({
											a: contact.address,
											d: contact.displayName,
											t: contact.type
										})
									),
									{ // TODO: add own data
										a: 'admin@example.com',
										d: 'Example',
										t: 'f'
									}
								]
							}
						}
					);
					return _saveDraftRequest;
				},
				[]
			);

			if (saveDraftRequest.length > 0) {
				// eslint-disable-next-line no-param-reassign
				batchRequest.SaveDraftRequest =	[
					...(batchRequest.SaveDraftRequest || []),
					...saveDraftRequest
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
	_fetch: SoapFetch
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
			return _fetch<BatchRequest, BatchResponse>(
				'Batch',
				_batchRequest
			)
				.then(({ SaveDraftResponse: saveDraftResponse }) => {
					if (saveDraftResponse) {
						const creationChanges = reduce<any, IUpdateChange[]>(
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
