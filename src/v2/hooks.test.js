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
jest.mock('@zextras/zapp-shell');
jest.mock('./db/mails-db-dexie');
jest.mock('./db/mails-db');

import { renderHook, act } from '@testing-library/react-hooks';
// eslint-disable-next-line import/no-unresolved
import { hooks } from '@zextras/zapp-shell';
import { MailsDb } from './db/mails-db';
import { useConvsInFolder } from './hooks';
import { MailsFolder } from './db/mails-folder';
import { MailConversation } from './db/mail-conversation';

describe('Hooks', () => {
	test('useConvsInFolder', async () => {
		const db = new MailsDb();
		db.folders.get.mockImplementation(() => Promise.resolve(new MailsFolder({
			_id: 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx',
			id: '1000'
		})));
		const convs = [];
		// eslint-disable-next-line no-plusplus
		for (let i = 0; i < 50; i++) convs.push(new MailConversation({ id: `-10${i < 10 ? `0${i}` : i}` }));
		const sortBy = jest.fn().mockImplementation(() => Promise.resolve(convs));
		db.conversations.where.mockImplementation(() => ({
			equals: () => ({
				reverse: jest.fn().mockImplementation(() => ({
					sortBy,
					limit: jest.fn().mockImplementation(() => ({
						sortBy
					}))
				}))
			})
		}));

		hooks.useAppContext.mockImplementation(() => ({ db }));
		db.checkHasMoreConv.mockImplementationOnce(() => Promise.resolve(true));
		db.fetchMoreConv.mockImplementation(() => Promise.resolve([[], false]));

		const { result, waitForNextUpdate } = renderHook(() => useConvsInFolder('xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx'));
		expect(result.current.folder).toBeUndefined();
		expect(result.current.conversations.length).toBe(0);
		expect(result.current.loadMore).toBeUndefined();
		expect(result.current.isLoading).toBe(true);
		expect(result.current.hasMore).toBe(false);

		await waitForNextUpdate();

		expect(result.current.folder).toBeInstanceOf(MailsFolder);
		expect(result.current.conversations.length).toBe(50);
		expect(result.current.loadMore).toBeInstanceOf(Function);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.hasMore).toBe(true);

		db.checkHasMoreConv.mockImplementationOnce(() => Promise.resolve(true));
		db.fetchMoreConv.mockImplementation(() => Promise.resolve([[
			new MailConversation({ id: '-10051' })
		], false]));
		await act(() => result.current.loadMore());

		expect(result.current.folder).toBeInstanceOf(MailsFolder);
		expect(result.current.conversations.length).toBe(51);
		expect(result.current.loadMore).toBeUndefined();
		expect(result.current.isLoading).toBe(false);
		expect(result.current.hasMore).toBe(false);
	});
});
