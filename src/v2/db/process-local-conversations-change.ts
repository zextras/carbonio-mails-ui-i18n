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
	ICreateChange,
	IDatabaseChange, IDeleteChange, IUpdateChange
} from 'dexie-observable/api';
import {
	filter, keyBy, map, reduce
} from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { SoapFetch } from '@zextras/zapp-shell';
import { MailsDb, DeletionData } from './mails-db';
import {
	BatchedRequest,
	BatchRequest,
	BatchResponse,
	ConvActionRequest,
} from '../soap';

function processConvUpdates(
	db: MailsDb,
	changes: IUpdateChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);

	return db.conversations.where('_id').anyOf(map(changes, 'key')).toArray()
		.then((dbConvsArray) => keyBy(dbConvsArray, '_id'))
		.then((conversations) => {
			const convActionRequest: Array<BatchedRequest & ConvActionRequest> = [];
			reduce<IUpdateChange, Array<BatchedRequest & ConvActionRequest>>(
				changes,
				(acc, change) => {
					if (change.mods.parent) {
						if (change.mods.parent === '2') {
							acc.push({
								_jsns: 'urn:zimbraMail',
								requestId: change.key,
								action: {
									op: 'trash',
									id: conversations[change.key].id!,
								}
							});
						}
						else {
							acc.push({
								_jsns: 'urn:zimbraMail',
								requestId: change.key,
								action: {
									op: 'move',
									l: change.mods.parent,
									id: conversations[change.key].id!,
								}
							});
						}
					}
					// eslint-disable-next-line no-prototype-builtins
					if (change.mods.hasOwnProperty('flagged')) {
						acc.push({
							_jsns: 'urn:zimbraMail',
							requestId: change.key,
							action: {
								id: conversations[change.key].id!,
								op: (change.mods.flagged) ? 'flag' : '!flag'
							}
						});
					}
					// eslint-disable-next-line no-prototype-builtins
					if (change.mods.hasOwnProperty('read')) {
						acc.push({
							_jsns: 'urn:zimbraMail',
							requestId: change.key,
							action: {
								id: conversations[change.key].id!,
								op: (change.mods.read) ? 'read' : '!read'
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

function processConvDeletions(
	db: MailsDb,
	changes: IDeleteChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);
	return db.deletions.where('_id').anyOf(map(changes, 'key')).toArray()
		.then((deletionsArray) => keyBy(
			filter(deletionsArray, ['table', 'conversations']),
			'_id'
		))
		.then((deletions: {[id: string]: DeletionData}) => {
			const convActionRequest: Array<BatchedRequest & ConvActionRequest> = [];
			reduce(
				changes,
				(acc, change) => {
					acc.push({
						_jsns: 'urn:zimbraMail',
						requestId: change.key,
						action: {
							op: 'delete',
							id: deletions[change.key].id,
						}
					});
					localChanges.push({
						type: 3,
						table: 'deletions',
						key: deletions[change.key].rowId
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
			).then(() => _dbChanges);
		});
}
