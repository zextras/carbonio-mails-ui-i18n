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

import { renderHook } from '@testing-library/react-hooks';
import { Subject } from 'rxjs';
jest.mock('@zextras/zapp-shell');
jest.mock('./db/mails-db');
import { hooks } from '@zextras/zapp-shell';
import { useConversationsInFolder } from './hooks';
import { MailsDb } from './db/mails-db';

describe('Hooks', () => {

	test('useConversationsInFolder', () => {
		const db = new MailsDb();
		const subject = new Subject();
		db.observe.mockImplementation(() => subject);
		hooks.useAppContext.mockImplementation(() => ({ db }));
		const { result } = renderHook(() => useConversationsInFolder('xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx'));

		expect(result.current.folder).toBeUndefined();
	});

});
