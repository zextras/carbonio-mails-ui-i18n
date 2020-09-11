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
	ICreateChange, IDatabaseChange,
	IDeleteChange, IUpdateChange
} from 'dexie-observable/api';
import { filter, reduce, map } from 'lodash';
import { SoapFetch } from '@zextras/zapp-shell';
import { DeletionData, MailsDb } from './mails-db';
import { MailsFolderFromDb } from './mails-folder';
import {
	BatchedRequest,
	BatchedResponse,
	BatchRequest,
	BatchResponse,
	CreateFolderResponse,
	FolderActionRequest
} from '../soap';

function processInserts(
	db: MailsDb,
	changes: ICreateChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);
	const CreateFolderRequest: any[] = [];
	reduce<ICreateChange, any[]>(
		changes,
		(r, c) => {
			r.push({
				_jsns: 'urn:zimbraMail',
				requestId: c.key,
				folder: {
					l: c.obj.parent,
					name: c.obj.name,
					view: 'message'
				}
			});
			return r;
		},
		CreateFolderRequest
	);
	if (CreateFolderRequest.length > 0) {
		batchRequest.CreateFolderRequest = [...(batchRequest.CreateFolderRequest || []), ...CreateFolderRequest];
	}
	return Promise.resolve([batchRequest, localChanges]);
}

function processUpdates(
	db: MailsDb,
	changes: IUpdateChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);

	return db.folders.where('_id').anyOf(map(changes, 'key')).toArray().then((folders) => {
		const uuidToId = reduce<MailsFolderFromDb, {[key: string]: string}>(
			folders,
			(r, f) => {
				if (f.id) {
					r[f._id] = f.id;
				}
				return r;
			},
			{}
		);
		const folderActionRequest: Array<BatchedRequest & FolderActionRequest> = [];
		reduce(
			changes,
			(r, c) => {
				if (c.mods.name) {
					r.push({
						_jsns: 'urn:zimbraMail',
						requestId: c.key,
						action: {
							op: 'rename',
							id: uuidToId[c.key],
							name: c.mods.name
						}
					});
				}
				if (c.mods.parent) {
					r.push({
						_jsns: 'urn:zimbraMail',
						requestId: c.key,
						action: {
							op: 'move',
							id: uuidToId[c.key],
							l: c.mods.parent
						}
					});
				}
				return r;
			},
			folderActionRequest
		);

		if (folderActionRequest.length > 0) {
			batchRequest.FolderActionRequest = [...(batchRequest.FolderActionRequest || []), ...folderActionRequest];
		}
		return [batchRequest, localChanges];
	});
}

function processDeletions(
	db: MailsDb,
	changes: IDeleteChange[],
	batchRequest: BatchRequest,
	localChanges: IDatabaseChange[],
): Promise<[BatchRequest, IDatabaseChange[]]> {
	if (changes.length < 1) return Promise.resolve([batchRequest, localChanges]);
	return db.deletions.where('_id').anyOf(map(changes, 'key')).toArray().then((deletedIds) => {
		const uuidToId = reduce<DeletionData, {[key: string]: {id: string; rowId: string}}>(
			filter(deletedIds, ['table', 'folders']),
			(r, d) => {
				r[d._id] = { id: d.id, rowId: d.rowId! };
				return r;
			},
			{}
		);
		const folderActionRequest: Array<BatchedRequest & FolderActionRequest> = [];
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
			folderActionRequest
		);
		if (folderActionRequest.length > 0) {
			batchRequest.FolderActionRequest = [...(batchRequest.FolderActionRequest || []), ...folderActionRequest];
		}
		return Promise.resolve([batchRequest, localChanges]);
	});
}

function processCreationResponse(r: BatchedResponse & CreateFolderResponse): IUpdateChange {
	const folder = r.folder[0];
	return {
		type: 2,
		table: 'folders',
		key: r.requestId,
		mods: {
			id: folder.id,
			name: folder.name,
			path: folder.absFolderPath,
			parent: folder.l
		}
	};
}

// TODO: Return local changes to apply the zimbra ids to the folders
export default function processLocalFolderChange(
	db: MailsDb,
	changes: IDatabaseChange[],
	soapFetch: SoapFetch
): Promise<IDatabaseChange[]> {
	if (changes.length < 1) return Promise.resolve([]);
	const folderChanges = filter(changes, ['table', 'folders']);
	const batchRequest: BatchRequest = {
		_jsns: 'urn:zimbra',
		onerror: 'continue'
	};

	return processInserts(
		db,
		filter(folderChanges, ['type', 1]) as ICreateChange[],
		batchRequest,
		[]
	)
		.then(([_batchRequest, _dbChanges]) => processUpdates(
			db,
			filter(folderChanges, ['type', 2]) as IUpdateChange[],
			_batchRequest,
			_dbChanges
		))
		.then(([_batchRequest, _dbChanges]) => processDeletions(
			db,
			filter(folderChanges, ['type', 3]) as IDeleteChange[],
			_batchRequest,
			_dbChanges
		))
		.then(([_batchRequest, _dbChanges]) => {
			if (!_batchRequest.CreateFolderRequest && !_batchRequest.FolderActionRequest) {
				return _dbChanges;
			}
			return soapFetch<BatchRequest, BatchResponse>(
				'Batch',
				_batchRequest
			)
				.then(({ CreateFolderResponse }) => {
					if (CreateFolderResponse) {
						const creationChanges = reduce<any, IUpdateChange[]>(
							CreateFolderResponse,
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
