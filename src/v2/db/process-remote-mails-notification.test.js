
jest.mock('./mails-db-dexie');

import { MailMessageFromSoap } from './mail-message';
import processRemoteMailsNotification, { fetchMessages } from './process-remote-mails-notification';
import { MailsDb } from './mails-db';

describe('Notifications - Mails', () => {
	test('Fetch Messages', (done) => {
		const _fetch = jest.fn().mockImplementation(() => Promise.resolve({
			json: jest.fn().mockImplementation(() => Promise.resolve({
				Body: {
					GetMsgResponse: {
						m: [{
							id: '1000'
						}]
					}
				}
			}))
		}));
		fetchMessages(
			_fetch,
			['1000']
		)
			.then((msg) => {
				expect(_fetch).toHaveBeenCalledTimes(1);
				expect(msg.length).toBe(1);
				expect(msg[0]).toBeInstanceOf(MailMessageFromSoap);
				expect(msg[0].id).toBe('1000');
				done();
			})
			.catch((e) => done(e));
	});
	test('Initial Sync', (done) => {
		const db = new MailsDb();
		const _fetch = jest.fn().mockImplementation(() => Promise.resolve({
			json: jest.fn().mockImplementation(() => Promise.resolve({
				Body: {
					GetMsgResponse: {
						m: [{
							id: '1000',
						}]
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
						m: [{
							ids: '1000' // Comma-separated values
						}],
						id: '7',
						l: '1',
						name: 'Messages',
						view: 'message'
					}],
					id: '1',
					l: '11',
					name: 'USER_ROOT'
				}]
			}],
		};
		processRemoteMailsNotification(
			_fetch,
			db,
			true,
			[],
			[],
			SyncResponse
		)
			.then((changes) => {
				expect(_fetch).toHaveBeenCalledTimes(1);
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(1);
				expect(changes[0].table).toBe('messages');
				expect(changes[0].key).toBeUndefined();
				expect(changes[0].obj).toBeInstanceOf(MailMessageFromSoap);
				done();
			});
	});

	test('New Message', (done) => {
		const db = new MailsDb();
		const _fetch = jest.fn().mockImplementation(() => Promise.resolve({
			json: jest.fn().mockImplementation(() => Promise.resolve({
				Body: {
					GetMsgResponse: {
						m: [{
							id: '1000'
						}]
					}
				}
			}))
		}));
		const SyncResponse = {
			md: 1,
			token: 1,
			m: [{
				d: 1,
				id: '1000',
				l: '7'
			}],
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
				expect(_fetch).toHaveBeenCalledTimes(1);
				expect(changes.length).toBe(1);
				expect(changes[0].type).toBe(1);
				expect(changes[0].table).toBe('messages');
				expect(changes[0].key).toBeUndefined();
				expect(changes[0].obj).toBeInstanceOf(MailMessageFromSoap);
				done();
			});
	});

	test('Deleted Message', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailMessageFromSoap({
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
				expect(changes[0].type).toBe(3);
				expect(changes[0].table).toBe('messages');
				expect(changes[0].key).toBe('xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx');
				done();
			});
	});

	test('Updated Message - Marked as read', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailMessageFromSoap({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000',
						parent: '9',
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
					attachment: true,
					flagged: false,
					parent: '7',
					read: false,
					urgent: true
				});
				done();
			});
	});

	test('Updated Message - Moved', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailMessageFromSoap({
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
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailMessageFromSoap({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000',
						parent: '7',
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
