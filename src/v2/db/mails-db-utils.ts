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

import {
	forEach
} from 'lodash';
import { MailsFolderFromSoap } from './mails-folder';
import { SyncResponseMailFolder } from '../soap';

function normalizeFolder(soapFolderObj: SyncResponseMailFolder): MailsFolderFromSoap {
	return new MailsFolderFromSoap({
		itemsCount: soapFolderObj.n,
		name: soapFolderObj.name,
		// _id: soapFolderObj.uuid,
		id: soapFolderObj.id,
		path: soapFolderObj.absFolderPath,
		unreadCount: soapFolderObj.u || 0,
		size: soapFolderObj.s,
		parent: soapFolderObj.l
	});
}

export function normalizeMailsFolders(f: SyncResponseMailFolder): MailsFolderFromSoap[] {
	if (!f) return [];
	let children: MailsFolderFromSoap[] = [];
	if (f.folder) {
		forEach(f.folder, (c: SyncResponseMailFolder) => {
			const child = normalizeMailsFolders(c);
			children = [...children, ...child];
		});
	}
	if (f.id === '3' || (f.view && f.view === 'message')) {
		return [normalizeFolder(f), ...children];
	}

	return children;
}
