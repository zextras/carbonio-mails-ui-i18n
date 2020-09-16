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
import processLocalMailsChange from './process-local-mails-change';
import { MailMessageFromDb } from './mail-message';
// eslint-disable-next-line import/order

describe('Local Changes - Mail', () => {
	test('Create a Draft', (done) => {
		const db = new MailsDb();
		const fetch = jest.fn()
			.mockImplementationOnce(() => Promise.resolve({
				SaveDraftResponse: [{
					requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
					m: [{
						id: '1000',
						cid: '-1000',
						d: 1598610497000
					}]
				}]
			}))
			.mockImplementationOnce({
				md: 1,
				token: 1
			});
		processLocalMailsChange(
			db,
			[{
				type: 1,
				table: 'messages',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				obj: {
					parent: '6',
					subject: 'subject',
					read: false,
					flag: false,
					urgent: false,
					attachment: false,
					parts: [
						{
							contentType: 'text/plain',
							content: 'plain text mail',
						},
						{
							contentType: 'text/html',
							content: '<p>plain text mail</p>',
						}
					],
					contacts: [
						{
							address: 'admin@example.com',
							displayName: 'Example',
							type: 'f'
						},
						{
							address: 'to@example.com',
							displayName: 'To Contact',
							type: 't'
						}
					],
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
						conversation: '-1000',
						date: 1598610497000,
					},
					table: 'messages',
					type: 2
				});
				expect(fetch).toHaveBeenCalledTimes(1);
				expect(fetch).toHaveBeenCalledWith(
					'Batch',
					{
						_jsns: 'urn:zimbra',
						onerror: 'continue',
						SaveDraftRequest: [{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
							m: {
								e: [
									{
										a: 'admin@example.com',
										d: 'Example',
										t: 'f'
									},
									{
										a: 'to@example.com',
										d: 'To Contact',
										t: 't'
									}
								],
								mp: [{
									ct: 'multipart/alternative',
									mp: [
										{
											ct: 'text/plain',
											content: 'plain text mail',
										},
										{
											ct: 'text/html',
											content: { _content: '<p>plain text mail</p>' },
										}
									]
								}],
								su: { _content: 'subject' }
							}
						}]
					}
				);
				done();
			}
		);
	});

	test('Moving a mail', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailMessageFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000'
					})
				]))
			}))
		}));
		const fetch = jest.fn()
			.mockImplementationOnce(() => Promise.resolve({
				MsgActionResponse: [{
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
		processLocalMailsChange(
			db,
			[{
				type: 2,
				table: 'messages',
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
						MsgActionRequest: [{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
							action: {
								op: 'move',
								l: '1001',
								id: '1000',
							}
						}],
					}
				);
				done();
			}
		);
	});

	test('Moving a mail to trash', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailMessageFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000'
					})
				]))
			}))
		}));
		const fetch = jest.fn()
			.mockImplementationOnce(() => Promise.resolve({
				MsgActionResponse: [{
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
		processLocalMailsChange(
			db,
			[{
				type: 2,
				table: 'messages',
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
						MsgActionRequest: [{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
							action: {
								op: 'trash',
								id: '1000',
							}
						}],
					}
				);
				done();
			}
		);
	});

	test('Flag / Unflag', (done) => {
		const fetch = jest.fn().mockImplementation(() => Promise.resolve({}));
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: () => ({
				toArray: () => Promise.resolve([
					new MailMessageFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
						id: '1000'
					}),
					new MailMessageFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
						id: '1001'
					})
				])
			})
		}));
		processLocalMailsChange(
			db,
			[{
				type: 2,
				table: 'messages',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
				mods: {
					flagged: true
				}
			}, {
				type: 2,
				table: 'messages',
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
						MsgActionRequest: [{
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
						}],
					}
				);
				done();
			});
	});

	test('Read / Unread', (done) => {
		const fetch = jest.fn().mockImplementation(() => Promise.resolve({}));
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: () => ({
				toArray: () => Promise.resolve([
					new MailMessageFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
						id: '1000'
					}),
					new MailMessageFromDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
						id: '1001'
					})
				])
			})
		}));
		processLocalMailsChange(
			db,
			[{
				type: 2,
				table: 'messages',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
				mods: {
					read: true
				}
			}, {
				type: 2,
				table: 'messages',
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
						MsgActionRequest: [{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx1',
							action: {
								id: '1000',
								op: 'read'
							}
						},
						{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxx2',
							action: {
								id: '1001',
								op: '!read'
							}
						}
						],
					}
				);
				done();
			});
	});

	test('Delete a draft', (done) => {
		const db = new MailsDb();
		const anyOf = jest.fn().mockImplementation(() => ({
			toArray: jest.fn().mockImplementation(() => Promise.resolve([{
				rowId: 'yyyyyyyy-yyyy-Myyy-Nyyy-yyyyyyyyyyyy',
				_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				id: '1000',
				table: 'messages',
			}]))
		}));
		db.deletions.where.mockImplementation(() => ({
			anyOf
		}));
		const fetch = jest.fn()
			.mockImplementationOnce(() => Promise.resolve({
				MsgActionResponse: [{
					requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
					action: {
						op: 'delete',
						id: '1000'
					},
					_jsns: 'urn:zimbraMail',
				}]
			}))
			.mockImplementationOnce(() => Promise.resolve({
				md: 1,
				token: 1,
			}));
		processLocalMailsChange(
			db,
			[{
				type: 3,
				table: 'messages',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
			}],
			fetch
		).then(
			(additionalChanges) => {
				expect(additionalChanges.length).toBe(1);
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
						MsgActionRequest: [{
							_jsns: 'urn:zimbraMail',
							requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
							action: {
								op: 'delete',
								id: '1000',
							}
						}],
					}
				);
				done();
			}
		);
	});
});
