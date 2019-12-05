/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2019 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import { IDBPDatabase, IDBPTransaction } from 'idb';
import { createFolderIdb } from '@zextras/zapp-shell/utils';
import { IMailIdbSchema } from './IMailSchema';

export const schemaVersion = 1;

function createDb(db: IDBPDatabase<IMailIdbSchema>): void {
	const mailsStore = db.createObjectStore('mails', { keyPath: 'id' });
	mailsStore.createIndex('folder', 'folder', { unique: false });
	mailsStore.createIndex('conversation', 'conversationId', { unique: false });
	const conversationsStore = db.createObjectStore('conversations', { keyPath: 'id' });
	// conversationsStore.createIndex('folder', 'folder', { unique: false, multiEntry: false });
	createFolderIdb(1, db);
}

export function upgradeFn(
	database: IDBPDatabase<IMailIdbSchema>,
	oldVersion: number,
	newVersion: number | null,
	transaction: IDBPTransaction<IMailIdbSchema>
): void {
	if (oldVersion < 1) {
		createDb(database);
	}
	else {
		switch (oldVersion) {
			case 1: {
				// Upgrade from version 1
				break;
			}
			default: {
				break;
			}
		}
	}
}
