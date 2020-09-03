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

jest.mock('./mails-db-dexie');


import { MailsDb } from './mails-db';
import { MailConversationFromSoap, MailConversationFromDb } from './mail-conversation';
import { processRemoteConversationsNotification } from './process-remote-conversations-notification';

describe('Notifications - conversation', () => {
	test('Initial Sync', (done) => {
		const db = new MailsDb();
		const fetch = jest.fn();
		const SyncResponse = {
			Body: {
				SyncResponse: {
					c: [
						{
							d: 1598537542000,
							id: '1',
							md: 1599060293,
							ms: 1821,
						}
					]
				}
			}
		};
		processRemoteConversationsNotification(
			fetch,
			db,
			true,
			[],
			[],
			SyncResponse
		)
			.then((changes) => {
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(1);
				expect(changes[0].table).toBe('conversations');
				expect(changes[0].key).toBeUndefined();
				expect(changes[0].obj).toBeInstanceOf(MailConversationFromSoap);
				done();
			});
	});

	test('New Conversation', (done) => {
		const db = new MailsDb();
		const _fetch = jest.fn().mockImplementation(() => Promise.resolve({
			json: jest.fn().mockImplementation(() => Promise.resolve({
				Body: {
					BatchResponse: {
						GetConvResponse: [
							{
								c: [
									{
										id: '1000',
									}
								]
							}
						]
					}
				}
			}))
		}));
		const SyncResponse = {
			Body: {
				SyncResponse: {
					c: [
						{
							d: 1598537542000,
							id: '1',
							md: 1599060293,
							ms: 1821,
							t: '',
							tn: '',
							u: 0
						}
					]
				}
			}
		};
		processRemoteConversationsNotification(
			_fetch,
			db,
			false,
			[],
			[],
			SyncResponse
		)
			.then((changes) => {
				expect(_fetch).toHaveBeenCalledTimes(1);
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(1);
				expect(changes[0].table).toBe('conversations');
				expect(changes[0].key).toBeUndefined();
				expect(changes[0].obj).toBeInstanceOf(MailConversationFromSoap);
				done();
			});
	});

	test('Deleted Conversation', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailConversationFromSoap({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000',
						parent: '7'
					}),
				]))
			}))
		}));
		const _fetch = jest.fn().mockImplementation(() => Promise.resolve({
			json: jest.fn().mockImplementation(() => Promise.resolve({}))
		}));
		const SyncResponse = {
			md: 2,
			token: 2,
			deleted: [{
				ids: '1000',
				m: [{
					ids: '1000',
				}]
			}],
		};
		processRemoteConversationsNotification(
			_fetch,
			db,
			false,
			[],
			[],
			SyncResponse
		)
			.then((changes) => {
				expect(_fetch).toHaveBeenCalledTimes(0);
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(3);
				expect(changes[0].table).toBe('messages');
				expect(changes[0].key).toBe('xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx');
				done();
			});
	});

	test('Updated Conversation - Marked as read', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailConversationFromSoap({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000',
						parent: '7',
						attachment: 'attachment',
						bodyPath: 'bodyPath',
						contacts: 'contacts',
						conversation: 'conversation',
						date: 'date',
						flagged: 'flagged',
						fragment: 'fragment',
						parts: 'parts',
						read: 'true',
						size: 'size',
						subject: 'subject',
						urgent: 'false'
					}),
				]))
			}))
		}));
		const _fetch = jest.fn();
		const SyncResponse = {
			md: 2,
			token: 2,
			m: [{
				d: 1,
				id: '1000',
				l: '7',
				md: 2,
				ms: '2',
				rev: '2',
				f: 'ua!',
				t: '',
				tn: ''
			}],
		};
		processRemoteConversationsNotification(
			_fetch,
			db,
			false,
			[],
			[],
			SyncResponse
		)
			.then((changes) => {
				expect(_fetch).toHaveBeenCalledTimes(0);
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(2);
				expect(changes[0].table).toBe('messages');
				expect(changes[0].key).toBe('xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx');
				expect(changes[0].mods).toStrictEqual({
					attachment: true,
					flagged: false,
					parent: '7',
					read: false,
					urgent: true
				});
				done();
			});
	});

	test('Updated conversation - Moved', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailConversationFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000',
						parent: '1001',
					}),
				]))
			}))
		}));
		const _fetch = jest.fn();
		const SyncResponse = {
			md: 2,
			token: 2,
			m: [{
				cid: 'conversation',
				d: 12,
				f: '!',
				id: '1000',
				l: '1001',
				md: 1598339530,
				ms: 1433,
				rev: 1392,
				t: '',
				tn: ''
			}]
		};
		processRemoteMailsNotification(
			_fetch,
			db,
			false,
			[],
			[],
			SyncResponse
		)
			.then((changes) => {
				expect(_fetch).toHaveBeenCalledTimes(0);
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(2);
				expect(changes[0].table).toBe('messages');
				expect(changes[0].key).toBe('xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx');
				expect(changes[0].mods).toStrictEqual({
					attachment: false,
					flagged: false,
					parent: '1001',
					read: true,
					urgent: true
				});
				done();
			});
	});

	test('Message flagged', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementationOnce(() => Promise.resolve([
					new MailMessageFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000',
						parent: '1001',
					}),
				]))
			}))
		}));
		const _fetch = jest.fn();
		const SyncResponse = {
			md: 2,
			token: 2,
			m: [{
				cid: 'conversation',
				d: 12,
				f: 'f',
				id: '1000',
				l: '1001',
				md: 1598339530,
				ms: 1433,
				rev: 1392,
				t: '',
				tn: ''
			}]
		};
		processRemoteMailsNotification(
			_fetch,
			db,
			false,
			[],
			[],
			SyncResponse
		)
			.then((changes) => {
				expect(_fetch).toHaveBeenCalledTimes(0);
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(2);
				expect(changes[0].table).toBe('messages');
				expect(changes[0].key).toBe('xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx');
				expect(changes[0].mods).toStrictEqual({
					attachment: false,
					flagged: true,
					read: true,
					urgent: false,
					parent: '1001'
				});
				done();
			});
	});
});
