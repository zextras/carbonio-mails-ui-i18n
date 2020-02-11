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

import { ISoapFolderObj } from '@zextras/zapp-shell/lib/network/ISoap';
import { IMailFolderSchmV1 } from './IMailsIdb';

export function normalizeFolder(soapFolderObj: ISoapFolderObj): IMailFolderSchmV1 {
	return {
		_revision: soapFolderObj.rev,
		itemsCount: soapFolderObj.n,
		name: soapFolderObj.name,
		id: soapFolderObj.id,
		path: soapFolderObj.absFolderPath,
		unreadCount: soapFolderObj.u || 0,
		size: soapFolderObj.s,
		parent: soapFolderObj.l,
		synced: false
	};
}
