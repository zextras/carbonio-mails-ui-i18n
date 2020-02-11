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
import { IMailsIdb } from './IMailsIdb';

export const schemaVersion = 1;

function createDb(database: IDBPDatabase<IMailsIdb>): void {
	const foldersStore = database.createObjectStore<'folders'>('folders', {
		keyPath: 'id'
	});
	foldersStore.createIndex('parent', 'parent');
	foldersStore.createIndex('path', 'path');

	const mailsStore = database.createObjectStore('messages', { keyPath: 'id' });
	mailsStore.createIndex('parent', 'parent', { unique: false });
	mailsStore.createIndex('conversation', 'conversation', { unique: false });
	const conversationsStore = database.createObjectStore('conversations', { keyPath: 'id' });
	conversationsStore.createIndex('parent', 'parent', { unique: false, multiEntry: true });
}

export function upgradeFn(
	database: IDBPDatabase<IMailsIdb>,
	oldVersion: number,
	newVersion: number | null,
	transaction: IDBPTransaction<IMailsIdb>
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
