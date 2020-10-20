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

/* eslint no-param-reassign: ["error", {"props": true,
															"ignorePropertyModificationsFor": ["r","f"] }] */

import { ICreateChange, IDatabaseChange, IUpdateChange } from 'dexie-observable/api';
import {
	reduce, map, filter, intersectionWith
} from 'lodash';
import { MailsDb } from './mails-db';
import { MailsFolderFromDb, MailsFolderFromSoap } from './mails-folder';
import { normalizeMailsFolders, SyncResponse, SyncResponseMailFolder } from '../soap';

function searchLocalFolders(db: MailsDb, ids: string[]): Promise<{[key: string]: string}> {
	return db.folders.where('id').anyOf(ids).toArray()
		.then((localFolders) => reduce<MailsFolderFromDb, {[key: string]: string}>(
			localFolders,
			(r, f) => {
				if (f.id) {
					r[f.id] = f._id;
				}
				return r;
			},
			{}
		));
}

function _isCreationUpdated(u: IUpdateChange, c: ICreateChange): boolean {
	return c.key === u.key && typeof u.mods.id !== 'undefined';
}

function searchForLocallyCreatedFolders(
	changes: IDatabaseChange[],
	localChangesFromRemote: IDatabaseChange[]
): Promise<{[key: string]: boolean}> {
	const localCreations = filter(filter(changes, ['table', 'folders']), ['type', 1]) as ICreateChange[];
	const remoteModifications = filter(filter(localChangesFromRemote, ['table', 'folders']), ['type', 2]) as IUpdateChange[];

	const isLocallyCreated = reduce(
		intersectionWith<IUpdateChange, ICreateChange>(
			remoteModifications,
			localCreations,
			_isCreationUpdated
		),
		(r, c) => {
			if (c.mods && c.mods.id) {
				r[c.mods.id] = true;
			}
			return r;
		},
		{}
	);

	return Promise.resolve(isLocallyCreated);
}

export default function processRemoteFolderNotifications(
	db: MailsDb,
	isInitialSync: boolean,
	changes: IDatabaseChange[],
	localChangesFromRemote: IDatabaseChange[],
	{ folder, deleted }: SyncResponse
): Promise<IDatabaseChange[]> {
	const folders = reduce<SyncResponseMailFolder, Array<MailsFolderFromSoap>>(
		folder || [],
		(r, f) => {
			const _folders = normalizeMailsFolders(f);
			r.push(..._folders);
			return r;
		},
		[]
	);

	if (isInitialSync) {
		return Promise.resolve(
			reduce<MailsFolderFromSoap, IDatabaseChange[]>(
				folders,
				(r, f) => {
					r.push({
						type: 1,
						table: 'folders',
						key: undefined,
						obj: f
					});
					return r;
				},
				[]
			)
		);
	}

	return searchLocalFolders(
		db,
		map<MailsFolderFromSoap>(folders, 'id'),
	)
		.then(
			(idToLocalUUIDMap) =>
				new Promise<{idToLocalUUIDMap: {[key: string]: string};
											isLocallyCreated: {[key: string]: boolean};}>((resolve) => {
												searchForLocallyCreatedFolders(changes, localChangesFromRemote)
													.then((isLocallyCreated) =>
														resolve({ idToLocalUUIDMap, isLocallyCreated }));
											})
		)
		.then(({ idToLocalUUIDMap, isLocallyCreated }) => {
			const dbChanges = reduce<MailsFolderFromSoap, IDatabaseChange[]>(
				folders,
				(r, f) => {
					if (Object.prototype.hasOwnProperty.call(idToLocalUUIDMap, f.id)) {
						f._id = idToLocalUUIDMap[f.id];
						r.push({
							type: 2,
							table: 'folders',
							key: f._id,
							mods: {
								id: f.id,
								parent: f.parent,
								itemsCount: f.itemsCount,
								name: f.name,
								path: f.path,
								unreadCount: f.unreadCount,
								size: f.size
							}
						});
					}
					else if (!isLocallyCreated[f.id!]) {
						r.push({
							type: 1,
							table: 'folders',
							key: undefined,
							obj: f
						});
					}
					return r;
				},
				[]
			);

			if (deleted && deleted[0] && deleted[0].folder) {
				return searchLocalFolders(
					db,
					deleted[0].folder[0].ids.split(','),
				)
					.then((deletedIdToLocalUUIDMap) => {
						reduce<{[key: string]: string}, IDatabaseChange[]>(
							deletedIdToLocalUUIDMap,
							(r, _id, id) => {
								r.push({
									type: 3,
									table: 'folders',
									key: _id,
								});
								return r;
							},
							dbChanges
						);
						return dbChanges;
					});
			}

			return dbChanges;
		});
}
