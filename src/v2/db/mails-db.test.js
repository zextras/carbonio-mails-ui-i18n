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
	test('getFolderChildren', (done) => {
		const db = new MailsDb();

		const mailsFolder = {
			id: '1000',
			path: '/Test Folder',
		};

		db.folders.where.mockImplementationOnce(() => ({
			sortBy: jest.fn().mockImplementation(() => Promise.resolve([
				{
					id: '1002',
					_id: '_id',
					itemsCount: 0,
					size: 0,
					unreadCount: 0,
					name: 'name',
					parent: 'parent',
					path: 'path'
				}
			])),
		}));

		db.getFolderChildren(
			mailsFolder
		)
			.then((res) => {
				expect(res).toBeDefined();
				expect(res).toStrictEqual([
					{
						id: '1002',
						_id: '_id',
						itemsCount: 0,
						size: 0,
						unreadCount: 0,
						name: 'name',
						parent: 'parent',
						path: 'path'
					}
				]);
				done();
			});
	});

	test('deleteFolder, folder not in db', (done) => {
		const db = new MailsDb();

		const mailsFolder = {
			_id: '1000',
			path: '/Test Folder',
		};

		db.folders.get.mockImplementation(() => Promise.resolve());

		db.deleteFolder(
			mailsFolder
		)
			.then((res) => {
				expect(res).toBeUndefined();
				expect(db.deletions.add).toBeCalledTimes(0);
				expect(db.folders.get).toBeCalledTimes(1);
				done();
			});
	});

	test('deleteFolder, successfull delete', (done) => {
		const db = new MailsDb();

		const mailsFolder = {
			_id: '1000',
			path: '/Test Folder',
		};
		const _f = new MailsFolderFromDb({
			id: '1002',
			_id: '_id',
			itemsCount: 0,
			size: 0,
			unreadCount: 0,
			name: 'name',
			parent: 'parent',
			path: 'path'
		});
		const deletion = {
			rowId: 'rowId',
			_id: '_id',
			id: '1002',
			table: 'folders'
		};
		db.folders.get.mockImplementation(() => Promise.resolve(_f));
		db.deletions.add.mockImplementation(() => Promise.resolve(deletion));

		db.deleteFolder(
			mailsFolder
		)
			.then((res) => {
				expect(res).toBeUndefined();
				expect(deletion.table).toBe('folders');
				expect(db.deletions.add).toBeCalledTimes(1);
				expect(db.folders.get).toBeCalledTimes(1);
				done();
			});
	});

	test('fetchMoreConv, Local folder not synced with remote', (done) => {
		const _fetch = jest.fn();
		const db = new MailsDb(_fetch);
		db.fetchMoreConv(
			new MailsFolderFromDb({})
		)
			.then((hasMore) => {
				expect(hasMore).toBe(false);
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

	test('checkForDuplicates, No duplicates', (done) => {
		const db = new MailsDb();

		const mockedRemoteConvs = [
			new MailConversationFromSoap({
				id: '1001'
			})
		];
		const mockedRemoteConvsMessages = [
			new MailMessageFromSoap({
				id: '1002'
			})
		];

		db.checkForDuplicates(
			mockedRemoteConvs,
			mockedRemoteConvsMessages
		)
			.then((result) => {
				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(Array);
				expect(result.length).toEqual(2);
				expect(result).toEqual([
					[
						{
							id: '1001'
						}
					],
					[
						{
							id: '1002'
						}
					]
				]);
				done();
			});
	});

	test('checkForDuplicates, Both duplicates', (done) => {
		const db = new MailsDb();

		const mockedRemoteConvs = [
			new MailConversationFromSoap({
				id: '1001',
				messages: [
					{ id: '1100' },
					{ id: '1101' }
				]
			})
		];
		const mockedRemoteConvsMessages = [
			new MailMessageFromSoap({ id: '1002' })
		];

		db.conversations.where.mockImplementationOnce(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailConversationFromDb({
						id: '1001'
					})
				])),
			})),
		}));

		db.messages.where.mockImplementationOnce(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailMessageFromDb({
						id: '1002'
					})
				])),
			})),
		}));

		db.checkForDuplicates(
			mockedRemoteConvs,
			mockedRemoteConvsMessages
		)
			.then((result) => {
				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(Array);
				expect(result.length).toEqual(2);
				expect(result).toStrictEqual([[], []]);
				done();
			});
	});

	test('saveConvsAndMessages, Both to Add', (done) => {
		const db = new MailsDb();

		const convsToAdd = [
			new MailConversationFromSoap({
				id: '1001'
			})
		];
		const convsMessagesToAdd = [
			new MailMessageFromSoap({
				id: '1002'
			})
		];
		db.messages.bulkAdd.mockImplementation(() => convsMessagesToAdd);
		db.conversations.bulkAdd.mockImplementation(() => convsToAdd);
		db.saveConvsAndMessages(
			convsToAdd,
			convsMessagesToAdd
		)
			.then((result) => {
				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(Array);
				expect(result.length).toEqual(2);
				expect(result).toEqual([
					[
						{
							id: '1002'
						}
					],
					[
						{
							id: '1001'
						}
					]
				]);
				done();
			});
	});

	test('saveConvsAndMessages, Nothing to Add', (done) => {
		const db = new MailsDb();

		const convsToAdd = [];
		const convsMessagesToAdd = [];

		db.messages.bulkAdd.mockImplementation(() => convsMessagesToAdd);
		db.conversations.bulkAdd.mockImplementation(() => convsToAdd);
		db.saveConvsAndMessages(
			convsToAdd,
			convsMessagesToAdd
		)
			.then((result) => {
				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(Array);
				expect(result.length).toEqual(2);
				expect(result).toStrictEqual([[], []]);
				done();
			});
	});

	test('CheckHasMoreConv, Local folder not synced with remote', (done) => {
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

	test('CheckHasMoreConv, Has more conversations', (done) => {
		const db = new MailsDb();

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

		const mailsFolderFromDb = {
			id: '1000',
			path: '/Test Folder'
		};

		const mailConversationfromDb = {
			_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
			id: '1001'
		};

		fetchConversationsInFolder.mockImplementation(() => Promise.resolve([
			mockedConversations,
			mockedConversationsMessages,
			false
		]));

		db.checkHasMoreConv(
			mailsFolderFromDb,
			mailConversationfromDb
		)
			.then((hasMore) => {
				expect(hasMore).toBe(true);
				done();
			});
	});

	test('CheckHasMoreConv, No more conversations', (done) => {
		const db = new MailsDb();

		const mailsFolderFromDb = {
			id: '1000',
			path: '/Test Folder'
		};

		const mailConversationfromDb = {
			_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
			id: '1001'
		};

		fetchConversationsInFolder.mockImplementation(() => Promise.resolve([[], [], false]));

		db.checkHasMoreConv(
			mailsFolderFromDb,
			mailConversationfromDb
		)
			.then((hasMore) => {
				expect(hasMore).toBe(false);
				done();
			});
	});
});
