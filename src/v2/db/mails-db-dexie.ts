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
import { MailsFolderFromDb } from './mails-folder';
import { MailMessageFromDb } from './mail-message';
import { MailConversationFromDb } from './mail-conversation';

export type DeletionData = {
	_id: string;
	id: string;
	table: 'mails'|'folders';
	rowId?: string;
};

export class MailsDbDexie extends db.Database {
	folders: Dexie.Table<MailsFolderFromDb, string>; // string = type of the primary key

	messages: Dexie.Table<MailMessageFromDb, string>; // string = type of the primary key

	conversations: Dexie.Table<MailConversationFromDb, string>; // string = type of the primary key

	deletions: Dexie.Table<DeletionData, string>;

	constructor() {
		super('mails');
		this.version(1).stores({
			folders: '$$_id, id, parent',
			messages: '$$_id, id, parent, conversation',
			conversations: '$$_id, id, *parent',
			deletions: '$$rowId, _id, id'
		});
		this.folders = this.table('folders');
		this.folders.mapToClass(MailsFolderFromDb);
		this.messages = this.table('messages');
		this.messages.mapToClass(MailMessageFromDb);
		this.conversations = this.table('conversations');
		this.conversations.mapToClass(MailConversationFromDb);
		this.deletions = this.table('deletions');
	}

	public open(): PromiseExtended<MailsDbDexie> {
		return super.open().then((_db) => _db as MailsDbDexie);
	}
}
