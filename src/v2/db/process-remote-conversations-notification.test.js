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
			md: 1,
			token: 1,
			folder: [{
				id: '11',
				folder: [{
					absFolderPath: '/',
					folder: [{
						absFolderPath: '/Contacts',
						c: [{
							ids: '1000' // Comma-separated values
						}],
						id: '7',
						name: 'Conversations',
						view: 'conversation'
					}],
					id: '1',
					name: 'USER_ROOT'
				}]
			}],
		};

		processRemoteConversationsNotification(
			_fetch,
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
										d: 1,
										n: 1,
										su: 'su',
										u: 0,
										m: [{ id: '1' }],
										e: [{
											a: 'a',
											d: 't',
											t: 't',
											isGroup: 1
										}]
									}
								]
							}
						]
					}
				}
			}))
		}));
		const SyncResponse = {
			c: [{
				d: 1,
				id: '1000',
				e: [
					{
						a: 'a',
						d: 't',
						t: 't',
						isGroup: 1
					}
				]
			}]
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
		db.conversations.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailConversationFromSoap({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000'
					}),
				]))
			}))
		}));
		const _fetch = jest.fn();
		const SyncResponse = {
			md: 2,
			token: 2,
			deleted: [{
				ids: '1000',
				c: [{
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
				expect(changes[0].table).toBe('conversations');
				expect(changes[0].key).toBe('xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx');
				done();
			});
	});

	test('Updated Conversation - Marked as read', (done) => {
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailConversationFromSoap({
						id: '1000',
						_id: '_id',
					}),
				]))
			}))
		}));
		const _fetch = jest.fn();
		const SyncResponse = {
			md: 2,
			token: 2,
			c: [{
				d: 1,
				id: '1000',
				f: 'ua!',
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
				expect(changes[0].table).toBe('conversations');
				expect(changes[0]).toStrictEqual(
					{
						key: '_id',
						mods: {
							attachment: true,
							date: 1,
							flagged: false,
							read: false,
							urgent: true
						},
						table: 'conversations',
						type: 2
					}
				);
				done();
			});
	});

	test('Message flagged', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementationOnce(() => Promise.resolve([
					new MailConversationFromDb({
						_id: '_id',
						id: '1000',
					}),
				]))
			}))
		}));
		const _fetch = jest.fn();
		const SyncResponse = {
			md: 2,
			token: 2,
			c: [{
				d: 1,
				id: '1000',
				f: 'f',
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
				expect(changes[0].table).toBe('conversations');
				expect(changes[0].key).toBe('_id');
				expect(changes[0]).toStrictEqual({
					key: '_id',
					mods: {
						attachment: false,
						date: 1,
						flagged: true,
						read: true,
						urgent: false
					},
					table: 'conversations',
					type: 2
				});
				done();
			});
	});

	test('Multiple changes - all cases left', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementationOnce(() => Promise.resolve([
					new MailConversationFromDb({
						_id: '_id',
						id: '1000',
					}),
				]))
			}))
		}));
		const _fetch = jest.fn();
		const SyncResponse = {
			md: 2,
			token: 2,
			c: [{
				d: 1,
				id: '1000',
				n: 1,
				u: 1,
				su: 'subject',
				fr: [
					'1',
					'2',
					'3'
				],
				e: [{
					a: 'a',
					d: 't',
					t: 't',
					isGroup: 1
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
				expect(changes[0].type).toBe(2);
				expect(changes[0].table).toBe('conversations');
				expect(changes[0].key).toBe('_id');
				expect(changes[0]).toStrictEqual({
					key: '_id',
					mods: {
						date: 1,
						subject: 'subject',
						unreadMsgCount: 1,
						fragment: [
							'1',
							'2',
							'3',
						],
						msgCount: 1,
						participants: [
							{
								address: 'a',
								displayName: 't',
								type: 't',
							},
						],
					},
					table: 'conversations',
					type: 2
				});
				done();
			});
	});
});
