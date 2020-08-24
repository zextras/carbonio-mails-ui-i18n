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
import { MailMessage } from './mail-message';
import { MailConversation } from './mail-conversation';

export type DeletionData = {
	_id: string;
	id: string;
	table: 'mails'|'folders';
	rowId?: string;
};

export class MailsDbDexie extends db.Database {
	folders: Dexie.Table<MailsFolder, string>; // string = type of the primary key

	messages: Dexie.Table<MailMessage, string>; // string = type of the primary key

	conversations: Dexie.Table<MailConversation, string>; // string = type of the primary key

	deletions: Dexie.Table<DeletionData, string>;

	constructor() {
		super('mails');
		this.version(1).stores({
			folders: '$$_id, id, parent',
			messages: '$$_id, id, parent',
			conversations: '$$_id, id, parent',
			deletions: '$$rowId, _id, id'
		});
		this.folders = this.table('folders');
		this.folders.mapToClass(MailsFolder);
		this.messages = this.table('messages');
		this.messages.mapToClass(MailMessage);
		this.conversations = this.table('conversations');
		this.conversations.mapToClass(MailConversation);
		this.deletions = this.table('deletions');
	}

	public open(): PromiseExtended<MailsDbDexie> {
		return super.open().then((db) => db as MailsDbDexie);
	}
}
