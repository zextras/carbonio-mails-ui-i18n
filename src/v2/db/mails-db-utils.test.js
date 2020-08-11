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

import { normalizeMailsFolders } from './mails-db-utils';
import { MailsFolder } from './mails-folder';

describe('DB Utils', () => {
	test('Normalize Contact Folder, no children', () => {
		const f = normalizeMailsFolders({
			n: 1,
			name: 'Folder Name',
			id: '1000',
			absFolderPath: '/Folder Name',
			u: 0,
			s: 1,
			l: '1',
			view: 'message'
		});
		expect(f.length).toBe(1);
		expect(f[0]).toBeInstanceOf(MailsFolder);
		expect(f[0].id).toBe('1000');
		expect(f[0].itemsCount).toBe(1);
		expect(f[0].name).toBe('Folder Name');
		expect(f[0].path).toBe('/Folder Name');
		expect(f[0].unreadCount).toBe(0);
		expect(f[0].size).toBe(1);
		expect(f[0].parent).toBe('1');
	});
});
