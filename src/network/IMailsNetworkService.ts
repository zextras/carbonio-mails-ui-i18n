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

import { IFolderSchmV1 } from '@zextras/zapp-shell/lib/sync/IFolderSchm';
import { Conversation, MailMessage } from '../idb/IMailsIdb';

export interface IMailsNetworkService {
	fetchFolderByPath(path: string): Promise<IFolderSchmV1>;
	fetchFolderById(path: string): Promise<IFolderSchmV1>;

	fetchConversationsInFolder(id: string, limit?: number): Promise<Conversation[]>;
	fetchConversationsMessages(convs: Conversation[]): Promise<MailMessage[]>;
	fetchMailMessages(mailIds: string[]): Promise<MailMessage[]>;
	fetchConversations(convIds: string[]): Promise<Conversation[]>;

	uploadAttachment(file: File): Promise<void>;
}
