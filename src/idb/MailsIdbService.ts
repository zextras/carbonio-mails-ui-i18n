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

import { IDBPDatabase, openDB } from 'idb';
import { IFolderSchmV1 } from '@zextras/zapp-shell/lib/sync/IFolderSchm';
import { map, reduce } from 'lodash';
import { IMailsIdbService } from './IMailsIdbService';
import { IMailsIdb } from './IMailsIdb';
import { schemaVersion, upgradeFn } from './MailsIdb';

export default class MailsIdbService implements IMailsIdbService {
	private static _IDB_NAME = 'com_zextras_zapp_mails';

	private static _openDb(): Promise<IDBPDatabase<IMailsIdb>> {
		return openDB<IMailsIdb>(
			MailsIdbService._IDB_NAME,
			schemaVersion,
			{
				upgrade: upgradeFn
			}
		);
	}

	public getFolder(id: string): Promise<IFolderSchmV1|void> {
		return MailsIdbService._openDb()
			.then((idb) => idb.get<'folders'>('folders', id));
	}

	public getAllFolders(): Promise<{[id: string]: IFolderSchmV1}> {
		return new Promise((resolve, reject) => {
			MailsIdbService._openDb()
				.then(
					(idb) => idb.getAll<'folders'>('folders')
						.then((folders) => reduce<IFolderSchmV1, {[id: string]: IFolderSchmV1}>(
							folders,
							(r, v, k) => {
								// eslint-disable-next-line no-param-reassign
								r[v.id] = v;
								return r;
							},
							{}
						))
				)
				.then((folders) => resolve(folders))
				.catch((e) => reject(e));
		});
	}

	public saveFolderData(f: IFolderSchmV1): Promise<IFolderSchmV1> {
		return new Promise((resolve, reject) => {
			MailsIdbService._openDb()
				.then((idb) => idb.put<'folders'>('folders', f))
				.then((_) => resolve(f))
				.catch((e) => reject(e));
		});
	}

	public deleteFolders(ids: string[]): Promise<string[]> {
		if (ids.length < 1) return Promise.resolve([]);
		const cCopy = [...ids];
		const id = cCopy.shift();
		return MailsIdbService._openDb()
			.then((idb) => idb.delete<'folders'>('folders', id!))
			.then((_) => new Promise((resolve, reject) => {
				// TODO: Remove the children
				if (cCopy.length === 0) resolve([id!]);
				else {
					this.deleteFolders(cCopy)
						.then((r) => resolve([id!].concat(r)))
						.catch((e) => reject(e));
				}
			}));
	}

	public moveFolder(id: string, parent: string): Promise<void> {
		return new Promise((resolve, reject) => {
			MailsIdbService._openDb()
				.then((idb) => new Promise((resolve1, reject1) => {
					idb.get<'folders'>('folders', id)
						.then((f) => {
							if (!f) resolve1();
							idb.put<'folders'>('folders', { ...f!, parent })
								// TODO: Update the path and the children paths
								.then(
									() => idb.getAllFromIndex<'folders', 'parent'>(
										'folders',
										'parent',
										id
									)
										.then((folders) => Promise.all(
											map(
												folders,
												(f1) => idb.put<'folders'>(
													'folders',
													{ ...f1 }
												)
											)
										))
										.then(() => resolve1())
								)
								.catch((e) => reject1(e));
						});
				}))
				.then(() => resolve())
				.catch((e) => reject(e));
		});
	}

	public renameFolder(id: string, name: string): Promise<void> {
		return new Promise((resolve, reject) => {
			MailsIdbService._openDb()
				.then((idb) => new Promise((resolve1, reject1) => {
					idb.get<'folders'>('folders', id)
						.then((f) => {
							if (!f) resolve1();
							idb.put<'folders'>('folders', { ...f!, name })
								// TODO: Update the path and the children paths
								.then(() => resolve1())
								.catch((e) => reject1(e));
						});
				}))
				.then(() => resolve())
				.catch((e) => reject(e));
		});
	}
}
