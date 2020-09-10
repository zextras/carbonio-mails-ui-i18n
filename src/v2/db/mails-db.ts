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

import { PromiseExtended } from 'dexie';
import { SoapFetch } from '@zextras/zapp-shell';
import { MailsFolder, MailsFolderFromDb } from './mails-folder';
import { fetchConversationsInFolder } from '../soap';
import { MailsDbDexie } from './mails-db-dexie';
import { MailConversationFromDb, MailConversationFromSoap } from './mail-conversation';

export type DeletionData = {
	_id: string;
	id: string;
	table: 'mails'|'folders';
	rowId?: string;
};

export class MailsDb extends MailsDbDexie {
	constructor(
		private _soapFetch: SoapFetch
	) {
		super();
	}

	public open(): PromiseExtended<MailsDb> {
		return super.open().then((db) => db as MailsDb);
	}

	public getFolderChildren(folder: MailsFolder): Promise<MailsFolder[]> {
		// TODO: For locally created folders we should resolve the internal id, we should ALWAYS to that
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

	public checkHasMoreConv(f: MailsFolderFromDb, lastConv?: MailConversationFromDb): Promise<boolean> {
		if (!f.id) return Promise.resolve(false);
		return fetchConversationsInFolder(
			this._soapFetch,
			f,
			1,
			lastConv ? new Date(lastConv.date) : undefined
		).then(([convs, hasMore]) => (hasMore || (convs.length > 0)));
	}

	public fetchMoreConv(f: MailsFolderFromDb, lastConv?: MailConversationFromSoap): Promise<[Array<MailConversationFromSoap>, boolean]> {
		return fetchConversationsInFolder(
			this._soapFetch,
			f,
			50,
			lastConv ? new Date(lastConv.date) : undefined
		);
	}
}
