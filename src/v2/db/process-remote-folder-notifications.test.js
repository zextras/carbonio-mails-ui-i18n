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
import { MailsDb } from './mails-db';
import { MailsFolder } from './mails-folder';
import processRemoteFolderNotifications from './process-remote-folder-notifications';

jest.mock('./mails-db');

describe('Notifications - Folder', () => {
	test('Initial Sync', (done) => {
		const db = new MailsDb();
		const SyncResponse = {
			md: 1,
			token: 1,
			folder: [{
				id: '11',
				folder: [{
					absFolderPath: '/',
					folder: [{
						absFolderPath: '/Inbox',
						cn: [{
							ids: '1000' // Comma-separated values
						}],
						id: '2',
						l: '1',
						name: 'Inbox',
						view: 'message'
					}],
					id: '1',
					l: '11',
					name: 'USER_ROOT'
				}]
			}],
		};
		processRemoteFolderNotifications(
			db,
			true,
			[],
			[],
			SyncResponse
		)
			.then((changes) => {
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(1);
				expect(changes[0].table).toBe('folders');
				expect(changes[0].key).toBeUndefined();
				expect(changes[0].obj).toBeInstanceOf(MailsFolder);
				done();
			});
	});

	test('New Folder', (done) => {
		const db = new MailsDb();
		processRemoteFolderNotifications(
			db,
			false,
			[],
			[],
			{
				md: 1,
				token: 1,
				folder: [{
					absFolderPath: '/New Folder',
					id: '1000',
					l: '1',
					name: 'New Folder',
					view: 'message'
				}],
			}
		)
			.then((changes) => {
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(1);
				expect(changes[0].table).toBe('folders');
				expect(changes[0].key).toBeUndefined();
				expect(changes[0].obj).toBeInstanceOf(MailsFolder);
				done();
			});
	});

	test('Updated Folder - Name Changed', (done) => {
		const db = new MailsDb();
		db.folders.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailsFolder({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000',
						name: 'Folder Name',
						parent: '1',
						path: '/Folder Name'
					}),
				]))
			}))
		}));
		processRemoteFolderNotifications(
			db,
			false,
			[],
			[],
			{
				md: 1,
				token: 1,
				folder: [{
					absFolderPath: '/New Folder Name',
					id: '1000',
					l: '1',
					name: 'New Folder Name',
					view: 'message'
				}],
			}
		)
			.then((changes) => {
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(2);
				expect(changes[0].table).toBe('folders');
				expect(changes[0].key).toBe('xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx');
				expect(changes[0].mods).toEqual({
					id: '1000',
					itemsCount: 0,
					name: 'New Folder Name',
					parent: '1',
					path: '/New Folder Name',
					size: 0,
					unreadCount: 0
				});
				done();
			});
	});

	test('Deleted Folder - Found locally', (done) => {
		const db = new MailsDb();
		db.deletions.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailsFolder({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000',
						name: 'Folder Name',
						parent: '1',
						path: '/Folder Name'
					})
				]))
			}))
		}));
		processRemoteFolderNotifications(
			db,
			false,
			[],
			[],
			{
				md: 1,
				token: 1,
				deleted: [{
					folder: [{
						ids: '1000'
					}],
					ids: '1000'
				}],
			}
		)
			.then((changes) => {
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(3);
				expect(changes[0].table).toBe('folders');
				expect(changes[0].key).toBe('xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx');
				done();
			});
	});
});
