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

jest.mock('./mails-db');
jest.mock('./mails-db-dexie');
import { MailsDb } from './mails-db';

import { MailConversationMessage } from './mail-conversation-message';
import processLocalConvChange from './process-local-conversations-change';

describe('Local Changes - Conversations', () => {
	test.skip('Create a Change', (done) => {
		const db = new MailsDb();
		const fetch = jest.fn()
			.mockImplementationOnce(() => Promise.resolve({
				ConvActionResponse: [{
					requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
					_jsns: 'urn:zimbraMail',
					action: {
						id: '1000',
						op: '',
					},
				}]
			}))
			.mockImplementationOnce({
				md: 1,
				token: 1,
				m: {
					cid: '-801',
					d: 1598610497000,
					id: '801',
					l: '6',
					md: 55687,
					ms: 77212,
					rev: 1482,
				}
			});
		processLocalConvChange(
			db,
			[{
				type: 1,
				table: 'conversations',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				obj: {
					parent: '7',
				}
			}],
			fetch
		).then(
			(additionalChanges) => {
				expect(additionalChanges.length).toBe(1);
				expect(additionalChanges[0]).toStrictEqual({
					key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
					mods: {
						id: '1000',
					},
					table: 'conversations',
					type: 2
				});
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
								id: '1000',
								op: '',
							},
						}]
					}
				);
				done();
			}
		);
	});

	// TODO TYPE 2 UPDATING CHANGES

	test('Moving a conversation', (done) => {
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailConversationMessage({
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
				expect(additionalChanges.length).toBe(0);
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

	// TODO MOVING CONVERSATION TO TRASH

	test('Moving a conversation to trash', (done) => {
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailConversationMessage({
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
				expect(additionalChanges.length).toBe(0);
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
	// TODO PROCESS FLAGGED MAIL
	test('Flag / Unflag', (done) => {
		const fetch = jest.fn().mockImplementation(() => Promise.resolve({}));
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: () => ({
				toArray: () => Promise.resolve([
					new MailConversationMessage({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
						id: '1000'
					}),
					new MailConversationMessage({
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
				expect(changes.length).toBe(0);
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
	// TODO READ/UNREAD MAILS
	test('Read / Unread', (done) => {
		const fetch = jest.fn().mockImplementation(() => Promise.resolve({}));
		const db = new MailsDb();
		db.conversations.where.mockImplementation(() => ({
			anyOf: () => ({
				toArray: () => Promise.resolve([
					new MailConversationMessage({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
						id: '1000'
					}),
					new MailConversationMessage({
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
				expect(changes.length).toBe(0);
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

	// TODO TYPE 3 DELETING CHANGES
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
				expect(additionalChanges.length).toBe(1); // TODO problem here
				expect(additionalChanges[0]).toStrictEqual({
					key: 'yyyyyyyy-yyyy-Myyy-Nyyy-yyyyyyyyyyyy',
					table: 'deletions',
					type: 3
				});
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
