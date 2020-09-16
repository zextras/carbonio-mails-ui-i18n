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

import { MailConversationFromDb } from './mail-conversation';

jest.mock('./mails-db');
jest.mock('./mails-db-dexie');
import { MailsDb } from './mails-db';

import processLocalConvChange from './process-local-conversations-change';
import processLocalMailsChange from './process-local-mails-change';

describe('Local Changes - Conversations', () => {
	test('Moving a conversation', (done) => {
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailConversationFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000'
					})
				]))
			}))
		}));
		const fetch = jest.fn()
			.mockImplementationOnce(() => Promise.resolve({
				ConvActionResponse: [{
					requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
					_jsns: 'urn:zimbraMail',
					action: {
						id: '1000',
						l: '1001',
						op: 'move'
					}
				}]
			}))
			.mockImplementationOnce(() => Promise.resolve({
				md: 1,
				token: 1
			}));
		processLocalConvChange(
			db,
			[{
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				mods: {
					parent: '1001'
				}
			}],
			fetch
		).then(
			(additionalChanges) => {
				expect(additionalChanges.length).toBe(1);
				expect(fetch).toHaveBeenCalledTimes(1);
				expect(fetch).toHaveBeenCalledWith(
					'Batch',
					{
						_jsns: 'urn:zimbra',
						onerror: 'continue',
						ConvActionRequest: [{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
							action: {
								op: 'move',
								l: '1001',
								id: '1000',
							}
						}]
					}
				);
				done();
			}
		);
	});

	test('Moving a conversation to trash', (done) => {
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailConversationFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000'
					})
				]))
			}))
		}));
		const fetch = jest.fn()
			.mockImplementationOnce(() => Promise.resolve({
				ConvActionResponse: [{
					requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
					_jsns: 'urn:zimbraMail',
					action: {
						id: '1000',
						op: 'trash'
					}
				}]
			}))
			.mockImplementationOnce(() => Promise.resolve({
				md: 1,
				token: 1
			}));
		processLocalConvChange(
			db,
			[{
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				mods: {
					parent: '2',
				}
			}],
			fetch
		).then(
			(additionalChanges) => {
				expect(additionalChanges.length).toBe(1);
				expect(fetch).toHaveBeenCalledTimes(1);
				expect(fetch).toHaveBeenCalledWith(
					'Batch',
					{
						_jsns: 'urn:zimbra',
						onerror: 'continue',
						ConvActionRequest: [{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
							action: {
								op: 'trash',
								id: '1000',
							}
						}]
					}
				);
				done();
			}
		);
	});

	test('Flag / Unflag', (done) => {
		const fetch = jest.fn().mockImplementation(() => Promise.resolve({}));
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: () => ({
				toArray: () => Promise.resolve([
					new MailConversationFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
						id: '1000'
					}),
					new MailConversationFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
						id: '1001'
					})
				])
			})
		}));
		processLocalConvChange(
			db,
			[{
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
				mods: {
					flagged: true
				}
			}, {
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
				mods: {
					flagged: false
				}
			}],
			fetch
		)
			.then((changes) => {
				expect(changes.length).toBe(2);
				expect(fetch).toBeCalledTimes(1);
				expect(fetch).toHaveBeenNthCalledWith(
					1,
					'Batch',
					{
						_jsns: 'urn:zimbra',
						onerror: 'continue',
						ConvActionRequest: [{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
							action: {
								id: '1000',
								op: 'flag'
							}
						}, {
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
							action: {
								id: '1001',
								op: '!flag'
							}
						}]
					}
				);
				done();
			});
	});

	test('Read / Unread', (done) => {
		const fetch = jest.fn().mockImplementation(() => Promise.resolve({}));
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: () => ({
				toArray: () => Promise.resolve([
					new MailConversationFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
						id: '1000'
					}),
					new MailConversationFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
						id: '1001'
					})
				])
			})
		}));
		processLocalConvChange(
			db,
			[{
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
				mods: {
					read: true
				}
			}, {
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
				mods: {
					read: false
				}
			}],
			fetch
		)
			.then((changes) => {
				expect(changes.length).toBe(2);
				expect(fetch).toBeCalledTimes(1);
				expect(fetch).toHaveBeenNthCalledWith(
					1,
					'Batch',
					{
						_jsns: 'urn:zimbra',
						onerror: 'continue',
						ConvActionRequest: [{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
							action: {
								id: '1000',
								op: 'read'
							}
						}, {
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
							action: {
								id: '1001',
								op: '!read'
							}
						}]
					}
				);
				done();
			});
	});

	test('Delete a Conversation Change', (done) => {
		const db = new MailsDb();
		const anyOf = jest.fn().mockImplementation(() => ({
			toArray: jest.fn().mockImplementation(() => Promise.resolve([{
				rowId: 'yyyyyyyy-yyyy-Myyy-Nyyy-yyyyyyyyyyyy',
				_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				id: '1000',
				table: 'conversations',
			}]))
		}));
		db.deletions.where.mockImplementation(() => ({
			anyOf
		}));
		const fetch = jest.fn()
			.mockImplementationOnce(() => Promise.resolve({
				ConvActionResponse: [{
					requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
					action: {
						op: 'delete',
						id: '1000'
					},
					_jsns: 'urn:zimbraMail'
				}]
			}))
			.mockImplementationOnce(() => Promise.resolve({
				md: 1,
				token: 1
			}));
		processLocalConvChange(
			db,
			[{
				type: 3,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
			}],
			fetch
		).then(
			(additionalChanges) => {
				expect(additionalChanges.length).toBe(2);
				expect(additionalChanges[0]).toStrictEqual(
					{
						key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						table: 'conversations',
						type: 3
					},
					{
						key: 'yyyyyyyy-yyyy-Myyy-Nyyy-yyyyyyyyyyyy',
						table: 'deletions',
						type: 3
					}
				);
				expect(fetch).toHaveBeenCalledTimes(1);
				expect(fetch).toHaveBeenCalledWith(
					'Batch',
					{
						_jsns: 'urn:zimbra',
						onerror: 'continue',
						ConvActionRequest: [{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
							action: {
								op: 'delete',
								id: '1000',
							}
						}]
					}
				);
				done();
			}
		);
	});
});
