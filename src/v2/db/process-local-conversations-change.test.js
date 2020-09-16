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


	test('Delete a Conversation', (done) => {
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

	test('Process a list of local conversation changes', (done) => {
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => {
					console.log('conv mock');
					return Promise.resolve([
						new MailConversationFromDb({
							_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
							id: '1001'
						}),
						new MailConversationFromDb({
							_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
							id: '1002'
						}),
						new MailConversationFromDb({
							_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx3',
							id: '1003'
						}),
						new MailConversationFromDb({
							_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx4',
							id: '1004'
						}),
						new MailConversationFromDb({
							_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx5',
							id: '1005'
						}),
						new MailConversationFromDb({
							_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx5',
							id: '1005'
						}),
						new MailConversationFromDb({
							_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx6',
							id: '1006'
						}),
						new MailConversationFromDb({
							_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx7',
							id: '1007'
						}),
						new MailConversationFromDb({
							_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx8',
							id: '1008'
						})
					]);
				})
			}))
		}));
		db.deletions.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => {
					console.log('deletion mock');
					return Promise.resolve([
						{
							rowId: 'yyyyyyyy-yyyy-Myyy-Nyyy-yyyyyyyyyyyy',
							_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx0',
							id: '1000',
							table: 'conversations',
						}
					]);
				})
			}))
		}));

		const fetch = jest.fn();
		processLocalConvChange(
			db,
			[{
				type: 3,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx0',
			},
			{
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
				mods: {
					read: true
				}
			},
			{
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
				mods: {
					read: false
				}
			},
			{
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx3',
				mods: {
					flagged: true
				}
			},
			{
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx4',
				mods: {
					flagged: false
				}
			},
			{
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx5',
				mods: {
					parent: '1001'
				}
			},
			{
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx6',
				mods: {
					parent: '2',
				}
			},
			{
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx7',
				mods: {
					flagged: true,
					parent: '1001'
				}
			}, {
				type: 2,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx8',
				mods: {
					flagged: false,
					read: true
				}
			},
			{
				type: 2,
				table: 'messages',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx9',
			},
			{
				type: 3,
				table: 'messages',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxx10',
			},
			{
				type: 1,
				table: 'messages',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxx11',
			},
			],
			fetch
		).then(
			(additionalChanges) => {
				expect(additionalChanges.length).toBe(11);
				expect(fetch).toHaveBeenCalledTimes(1);
				expect(fetch).toHaveBeenCalledWith(
					'Batch',
					{
						_jsns: 'urn:zimbra',
						onerror: 'continue',
						ConvActionRequest: [{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
							action: {
								id: '1001',
								op: 'read'
							}
						},
						{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
							action: {
								id: '1002',
								op: '!read'
							}
						},
						{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx3',
							action: {
								id: '1003',
								op: 'flag'
							}
						},
						{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx4',
							action: {
								id: '1004',
								op: '!flag'
							}
						},
						{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx5',
							action: {
								op: 'move',
								l: '1001',
								id: '1005',
							}
						},
						{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx6',
							action: {
								op: 'trash',
								id: '1006',
							}
						},
						{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx7',
							action: {
								op: 'move',
								l: '1001',
								id: '1007',
							}
						},
						{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx7',
							action: {
								id: '1007',
								op: 'flag'
							}
						},
						{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx8',
							action: {
								id: '1008',
								op: '!flag'
							}
						},
						{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx8',
							action: {
								id: '1008',
								op: 'read'
							}
						},
						{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx0',
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
