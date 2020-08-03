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

import Dexie, { PromiseExtended } from 'dexie';
import { db } from '@zextras/zapp-shell';
import { MailsFolder } from './mails-folder';

export type DeletionData = {
	_id: string;
	id: string;
	table: 'mails'|'folders';
	rowId?: string;
};

export class MailsDb extends db.Database {
	folders: Dexie.Table<MailsFolder, string>; // string = type of the primary key

	deletions: Dexie.Table<DeletionData, string>;

	constructor() {
		super('mails');
		this.version(1).stores({
			folders: '$$_id, id, parent',
			deletions: '$$rowId, _id, id'
		});
		this.folders = this.table('folders');
		this.folders.mapToClass(MailsFolder);
		this.deletions = this.table('deletions');
	}

	public open(): PromiseExtended<MailsDb> {
		return super.open().then((db) => db as MailsDb);
	}

	public getFolderChildren(folder: MailsFolder): Promise<MailsFolder[]> {
		// TODO: For locally created folders we should resolve the internal id, we should ALWAYS to that.
		if (!folder.id) return Promise.resolve([]);
		return this.folders.where({ parent: folder.id }).sortBy('name');
	}

	public deleteFolder(f: MailsFolder): Promise<void> {
		return this.folders.get(f._id!).then((_f) => {
			if (_f) {
				console.log({ _id: _f._id!, id: _f.id!, table: 'folders' });
				return this.deletions.add({ rowId: this.createUUID(), _id: _f._id!, id: _f.id!, table: 'folders' })
					.then(() => this.folders.delete(_f._id!).then(() => undefined))
					.catch(console.error);
			}
			return undefined;
		});
	}

}
