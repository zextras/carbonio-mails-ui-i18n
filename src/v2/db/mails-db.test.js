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

import { MailMessageFromSoap } from './mail-message';

jest.mock('../soap');
import { fetchConversationsInFolder } from '../soap';

jest.mock('./mails-db-dexie');
import { MailsDb } from './mails-db';

import { MailsFolderFromDb } from './mails-folder';
import { MailConversationFromDb, MailConversationFromSoap } from './mail-conversation';

describe('Mails DB', () => {
	test('fetchMoreConv, Local folder not synced with remote', (done) => {
		const fetch = jest.fn();
		const db = new MailsDb(
			fetch
		);
		db.fetchMoreConv(
			new MailsFolderFromDb({})
		)
			.then((hasMore) => {
				expect(hasMore).toBeFalsy();
				expect(db.conversations.bulkAdd).not.toHaveBeenCalled();
				done();
			});
	});

	test('fetchMoreConv, Load more from remote, not present locally', (done) => {
		fetchConversationsInFolder.mockImplementation(() => Promise.resolve([
			[
				new MailConversationFromSoap({
					id: '1001'
				})
			],
			[
				new MailMessageFromSoap({
					id: '1002'
				})
			],
			false
		]));
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([])),
			})),
		}));
		db.createUUID.mockImplementationOnce(() => ('xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx'));
		db.fetchMoreConv(
			new MailsFolderFromDb({
				id: '1000',
				path: '/Test Folder'
			})
		)
			.then((hasMore) => {
				expect(hasMore).toBeFalsy();
				expect(db.conversations.bulkAdd).toHaveBeenCalled();
				done();
			});
	});

	test('fetchMoreConv, Load more from remote, present locally', (done) => {
		fetchConversationsInFolder.mockImplementation(() => Promise.resolve([
			[
				new MailConversationFromSoap({
					id: '1001'
				})
			],
			[
				new MailMessageFromSoap({
					id: '1002'
				})
			],
			false
		]));
		const db = new MailsDb();
		db.transaction.mockImplementation(() => Promise.resolve());
		db.conversations.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailConversationFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1001'
					})
				])),
			})),
		}));
		db.fetchMoreConv(
			new MailsFolderFromDb({
				id: '1000',
				path: '/Test Folder'
			})
		)
			.then((hasMore) => {
				expect(hasMore).toBeFalsy();
				expect(db.conversations.bulkAdd).not.toHaveBeenCalled();
				done();
			});
	});
});
