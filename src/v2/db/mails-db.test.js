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

import { MailMessageFromSoap, MailMessageFromDb } from './mail-message';

jest.mock('../soap');
import { fetchConversationsInFolder } from '../soap';

jest.mock('./mails-db-dexie');
import { MailsDb } from './mails-db';

import { MailsFolderFromDb } from './mails-folder';
import { MailConversationFromDb, MailConversationFromSoap } from './mail-conversation';

describe('Mails DB', () => {
	test('fetchMoreConv, Local folder not synced with remote', (done) => {
		const _fetch = jest.fn();
		const db = new MailsDb(_fetch);
		db.fetchMoreConv(
			new MailsFolderFromDb({})
		)
			.then((hasMore) => {
				expect(hasMore).toBeFalsy();
				expect(db.messages.bulkAdd).not.toHaveBeenCalled();
				expect(db.conversations.bulkAdd).not.toHaveBeenCalled();
				done();
			});
	});

	test('fetchMoreConv, Load more from remote, not present locally', (done) => {
		const mockedConversations = [
			new MailConversationFromSoap({
				id: '1001'
			})
		];
		const mockedConversationsMessages = [
			new MailMessageFromSoap({
				id: '1002'
			})
		];

		fetchConversationsInFolder.mockImplementation(() => Promise.resolve([
			mockedConversations,
			mockedConversationsMessages,
			false
		]));
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([])),
			})),
		}));
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([])),
			})),
		}));
		db.transaction.mockImplementation(() => Promise.resolve());
		db.fetchMoreConv(
			new MailsFolderFromDb({
				id: '1000',
				path: '/Test Folder'
			})
		)
			.then((hasMore) => {
				expect(hasMore).toBeFalsy();
				done();
			});
	});

	test('fetchMoreConv, Load more from remote, present locally', (done) => {
		const mockedConversations = [
			new MailConversationFromSoap({
				id: '1001'
			})
		];
		const mockedConversationsMessages = [
			new MailMessageFromSoap({
				id: '1002'
			})
		];
		fetchConversationsInFolder.mockImplementation(() => Promise.resolve([
			mockedConversations,
			mockedConversationsMessages,
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
		db.messages.where.mockImplementationOnce(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailMessageFromDb({
						_id: 'mxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1002'
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
				done();
			});
	});
});
