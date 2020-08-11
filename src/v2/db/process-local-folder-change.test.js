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

import { MailsFolder } from './mails-folder';
import { MailsDb } from './mails-db';
import processLocalFolderChange from './process-local-folder-change';

describe('Local Changes - Folder', () => {
	test('Create a folder', (done) => {
		const db = new MailsDb();
		const response = {
			json: jest.fn()
				.mockImplementationOnce(() => Promise.resolve({
					Body: {
						BatchResponse: {
							CreateFolderResponse: [{
								requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
								folder: [{
									id: '1000',
									name: 'New Folder',
									absFolderPath: '/New Folder',
									l: '1'
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
							folder: [{
								absFolderPath: '/New Folder',
								id: '1000',
								l: '1',
								name: 'New Folder',
								view: 'contact'
							}],
						}
					}
				})
		};
		const fetch = jest.fn().mockImplementation(() => Promise.resolve(response));
		processLocalFolderChange(
			db,
			[{
				type: 1,
				table: 'folders',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				obj: {
					name: 'Folder Name',
					parent: '1'
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
						name: 'New Folder',
						parent: '1',
						path: '/New Folder'
					},
					table: 'folders',
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
									CreateFolderRequest: [{
										_jsns: 'urn:zimbraMail',
										requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
										folder: {
											l: '1',
											name: 'Folder Name',
											view: 'message'
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

	test('Edit a folder - Name', (done) => {
		const db = new MailsDb();
		db.folders.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementationOnce(() => ({
				toArray: jest.fn().mockImplementationOnce(() => Promise.resolve([
					new MailsFolder({
						id: '1000',
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						name: 'Folder Name'
					})
				]))
			}))
		}));
		const response = {
			json: jest.fn()
				.mockImplementationOnce(() => Promise.resolve({
					Body: {
						BatchResponse: {}
					}
				}))
		};
		const fetch = jest.fn().mockImplementation(() => Promise.resolve(response));
		processLocalFolderChange(
			db,
			[{
				type: 2,
				table: 'folders',
				key: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				mods: {
					name: 'New Folder Name',
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
									FolderActionRequest: [{
										_jsns: 'urn:zimbraMail',
										requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
										action: {
											op: 'rename',
											id: '1000',
											name: 'New Folder Name'
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

	test('Edit a folder - Move', (done) => {
		const db = new MailsDb();
		db.folders.where.mockImplementation(() => ({
			anyOf: jest.fn().mockImplementationOnce(() => ({
				toArray: jest.fn().mockImplementationOnce(() => Promise.resolve([
					new MailsFolder({
						id: '1000',
						_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
						name: 'Folder Name'
					})
				]))
			}))
		}));
		const response = {
			json: jest.fn()
				.mockImplementationOnce(() => Promise.resolve({
					Body: {
						BatchResponse: {}
					}
				}))
		};
		const fetch = jest.fn().mockImplementation(() => Promise.resolve(response));
		processLocalFolderChange(
			db,
			[{
				type: 2,
				table: 'folders',
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
					'/service/soap/BatchRequest',
					{
						method: 'POST',
						body: JSON.stringify({
							Body: {
								BatchRequest: {
									_jsns: 'urn:zimbra',
									onerror: 'continue',
									FolderActionRequest: [{
										_jsns: 'urn:zimbraMail',
										requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
										action: {
											op: 'move',
											id: '1000',
											l: '2'
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

	test('Delete a folder', (done) => {
		const db = new MailsDb();
		const anyOf = jest.fn().mockImplementation(() => ({
			toArray: jest.fn().mockImplementation(() => Promise.resolve([{
				rowId: 'yyyyyyyy-yyyy-Myyy-Nyyy-yyyyyyyyyyyy',
				_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
				id: '1000',
				table: 'folders',
			}]))
		}));
		db.deletions.where.mockImplementation(() => ({
			anyOf
		}));
		const response = {
			json: jest.fn()
				.mockImplementationOnce(() => Promise.resolve({
					Body: {
						BatchResponse: {}
					}
				}))
		};
		const fetch = jest.fn().mockImplementation(() => Promise.resolve(response));
		processLocalFolderChange(
			db,
			[{
				type: 3,
				table: 'folders',
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
									FolderActionRequest: [{
										_jsns: 'urn:zimbraMail',
										requestId: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
										action: {
											op: 'delete',
											id: '1000',
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
});
