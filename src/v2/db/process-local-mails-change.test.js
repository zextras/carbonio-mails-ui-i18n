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

import { MailsDb, DeletionData } from './mails-db';
import processLocalMailsChange from './process-local-mails-change';

describe('Local Changes - Mail', () => {
	// TODO PROCESS THE LOCAL MAIL CHANGES
	test('Process Creation Response', (done) => {
		const db = new MailsDb();
		const response = {
			json: jest.fn()
				.mockImplementationOnce(() => Promise.resolve({
					Body: {
						BatchResponse: {
							CreateMailResponse: [{
								requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
								cn: [{
									id: '1000',
									l: '7',
								}]
							}]
						}
					}
				}))
				.mockImplementationOnce({
					Body: {
						SyncResponse: {
							md: 1,
							token: 1,
							cn: [{
								id: '1000',
							}],
						}
					}
				})
		};
		const fetch = jest.fn().mockImplementation(() => Promise.resolve(response));
		processLocalMailsChange(
			db,
			[{
				type: 1,
				table: 'messages',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
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
					table: 'messages',
					type: 2
				});
				expect(fetch).toHaveBeenCalledTimes(1);
				expect(fetch).toHaveBeenCalledWith(
					'/service/soap/BatchRequest',
					{
						method: 'POST',
						body: JSON.stringify({
							Body: {
								BatchRequest: {
									_jsns: 'urn:zimbra',
									onerror: 'continue',
									CreateMailRequest: [{
										_jsns: 'urn:zimbraMail',
										requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
									}]
								}
							}
						})
					}
				);
				done();
			}
		);
	});
	// TODO TYPE 1 INSERTING CHANGES

	test('Inserting Changes Mails', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailsDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000'
					})
				]))
			}))
		}));
		const response = {
			json: jest.fn()
				.mockImplementationOnce(() => Promise.resolve({
					Body: {
						BatchResponse: {
							ModifyMailResponse: [{
								requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
							}]
						}
					}
				}))
				.mockImplementationOnce({
					Body: {
						SyncResponse: {
							md: 1,
							token: '1',
						}
					}
				})
		};
		const fetch = jest.fn().mockImplementation(() => Promise.resolve(response));
		processLocalMailsChange(
			db,
			[{
				type: 2,
				table: 'messages',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				mods: {
					firstName: 'Updated Test',
					lastName: 'User'
				}
			}],
			fetch
		).then(
			(additionalChanges) => {
				expect(additionalChanges.length).toBe(0);
				expect(fetch).toHaveBeenCalledTimes(1);
				expect(fetch).toHaveBeenCalledWith(
					'/service/soap/BatchRequest',
					{
						method: 'POST',
						body: JSON.stringify({
							Body: {
								BatchRequest: {
									_jsns: 'urn:zimbra',
									onerror: 'continue',
									ModifyMailRequest: [{
										_jsns: 'urn:zimbraMail',
										requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
									}]
								}
							}
						})
					}
				);
				done();
			}
		);
	});
	// TODO other
	test('Update Mail', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailsDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000'
					})
				]))
			}))
		}));
		const response = {
			json: jest.fn()
				.mockImplementationOnce(() => Promise.resolve({
					Body: {
						BatchResponse: {
							ModifyContactResponse: [{
								requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
							}]
						}
					}
				}))
				.mockImplementationOnce({
					Body: {
						SyncResponse: {
							md: 1,
							token: 1,
						}
					}
				})
		};
		const fetch = jest.fn().mockImplementation(() => Promise.resolve(response));
		processLocalMailsChange(
			db,
			[{
				type: 2,
				table: 'messages',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				mods: {
					firstName: 'Updated Test',
					lastName: 'User'
				}
			}],
			fetch
		).then(
			(additionalChanges) => {
				expect(additionalChanges.length).toBe(0);
				expect(fetch).toHaveBeenCalledTimes(1);
				expect(fetch).toHaveBeenCalledWith(
					'/service/soap/BatchRequest',
					{
						method: 'POST',
						body: JSON.stringify({
							Body: {
								BatchRequest: {
									_jsns: 'urn:zimbra',
									onerror: 'continue',
									ModifyMailRequest: [{
										_jsns: 'urn:zimbraMail',
										requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
									}]
								}
							}
						})
					}
				);
				done();
			}
		);
	});
	// TODO TYPE 2 UPDATING CHANGES
	test('Updating Mails', (done) => {
		const db = new MailsDb();
		db.messages.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementation(() => ({
				toArray: jest.fn().mockImplementation(() => Promise.resolve([
					new MailsDb({
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						id: '1000'
					})
				]))
			}))
		}));
		const response = {
			json: jest.fn()
				.mockImplementationOnce(() => Promise.resolve({
					Body: {
						BatchResponse: {
							MailActionResponse: [{
								requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
								action: {
									id: '1000',
									op: 'move'
								}
							}]
						}
					}
				}))
				.mockImplementationOnce(() => Promise.resolve({
					Body: {
						SyncResponse: {
							md: 1,
							token: 1,
							cn: [{
								id: '1000',
							}],
						}
					}
				}))
		};

		const fetch = jest.fn().mockImplementation(() => Promise.resolve(response));
		processLocalMailsChange(
			db,
			[{
				type: 2,
				table: 'messages',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				mods: {
					parent: '1001',
				}
			}],
			fetch
		).then(
			(additionalChanges) => {
				expect(additionalChanges.length).toBe(0);
				expect(fetch).toHaveBeenCalledTimes(1);
				expect(fetch).toHaveBeenCalledWith(
					'/service/soap/BatchRequest',
					{
						method: 'POST',
						body: JSON.stringify({
							Body: {
								BatchRequest: {
									_jsns: 'urn:zimbra',
									onerror: 'continue',
									MailActionRequest: [{
										_jsns: 'urn:zimbraMail',
										requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
										action: {
											op: 'move',
										}
									}]
								}
							}
						})
					}
				);
				done();
			}
		);
	});
	// TODO TYPE 3 DELETING CHANGES
	test('Delete a change', (done) => {
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
		const response = {
			json: jest.fn()
				.mockImplementationOnce(() => Promise.resolve({
					Body: {
						BatchResponse: {
							MailActionResponse: [{
								requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
								action: {
									op: 'delete',
									id: '1000'
								}
							}]
						}
					}
				}))
				.mockImplementationOnce(() => Promise.resolve({
					Body: {
						SyncResponse: {
							md: 1,
							token: 1,
						}
					}
				}))
		};
		const fetch = jest.fn().mockImplementation(() => Promise.resolve(response));
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
				expect(anyOf).toHaveBeenCalledWith(['xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx']);
				expect(additionalChanges.length).toBe(1);
				expect(additionalChanges[0]).toStrictEqual({
					key: 'yyyyyyyy-yyyy-Myyy-Nyyy-yyyyyyyyyyyy',
					table: 'deletions',
					type: 3
				});
				expect(fetch).toHaveBeenCalledTimes(1);
				expect(fetch).toHaveBeenCalledWith(
					'/service/soap/BatchRequest',
					{
						method: 'POST',
						body: JSON.stringify({
							Body: {
								BatchRequest: {
									_jsns: 'urn:zimbra',
									onerror: 'continue',
									MailActionRequest: [{
										_jsns: 'urn:zimbraMail',
										requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
										action: {
											op: 'delete',
											id: '1000',
										}
									}],
								}
							}
						})
					}
				);
				done();
			}
		);
	});
});
