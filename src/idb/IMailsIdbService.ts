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

import { Conversation, IMailFolderSchmV1, MailMessage } from './IMailsIdb';

export interface IMailsIdbService {
	getFolder(id: string): Promise<IMailFolderSchmV1|undefined>;
	getAllFolders(): Promise<{[id: string]: IMailFolderSchmV1}>;
	saveFolderData(f: IMailFolderSchmV1): Promise<IMailFolderSchmV1>;
	deleteFolders(ids: string[]): Promise<string[]>;
	moveFolder(id: string, parent: string): Promise<void>;
	renameFolder(id: string, name: string): Promise<void>;
	saveConversation(conv: Conversation): Promise<Conversation>;
	saveConversations(convs: Conversation[]): Promise<Conversation[]>;
	fetchConversationsFromFolder(id: string): Promise<Conversation[]>;
	saveMailMessage(mail: MailMessage): Promise<MailMessage>;
	saveMailMessages(mails: MailMessage[]): Promise<MailMessage[]>;
	getConversation(id: string): Promise<Conversation|undefined>;
	getMessages(msgIds: string[]): Promise<{[id: string]: MailMessage}>;
}
