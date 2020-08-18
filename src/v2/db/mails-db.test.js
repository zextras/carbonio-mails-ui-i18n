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
// eslint-disable-next-line import/no-unresolved
import { _MOCKS_ } from '@zextras/zapp-shell';
import { MailsDb } from './mails-db';

jest.mock('@zextras/zapp-shell');

describe('Mails DB', () => {
	test('Moks', () => {
		const db = new MailsDb();

		expect(_MOCKS_.MockedDb_version).toBeCalledWith(1);
	});
});
