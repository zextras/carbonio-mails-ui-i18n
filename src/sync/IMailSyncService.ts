/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2019 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import { BehaviorSubject } from 'rxjs';
import { IFolderSchmV1 } from '@zextras/zapp-shell/lib/sync/IFolderSchm';
import { IConvSchm, IMailSchm } from '../idb/IMailSchema';

export interface IMailSyncService {
	folders: BehaviorSubject<Array<IMailFolder>>;
	getFolderContent(path: string): BehaviorSubject<Array<IConvSchm>>;
	getConversationMessages(convId: string): BehaviorSubject<Array<IMailSchm>>;
}

export type IMailFolder = IFolderSchmV1 & {
	children: Array<IMailFolder>;
};

export type ISyncMailItemData = {
	f: string;
	l?: string;
	id: string;
};

export type ISyncMailFolderData = {
	ids: string;
};
