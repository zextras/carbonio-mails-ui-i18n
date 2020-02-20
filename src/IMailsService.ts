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

import { Conversation, MailMessage } from './idb/IMailsIdb';
import { BehaviorSubject } from 'rxjs';

export interface IMailsService {
	createFolder(name: string, parent: string): Promise<void>;
	moveFolder(id: string, newParent: string): Promise<void>;
	renameFolder(id: string, name: string): Promise<void>;
	deleteFolder(id: string): Promise<void>;
	emptyFolder(id: string): Promise<void>;
	getFolderConversations(folderId: string): BehaviorSubject<Conversation[]>;
	loadMoreConversationsFromFolder(folderId: string): Promise<void>;
	getConversation(id: string): Promise<Conversation>;
	getMessages(msgIds: string[]): Promise<{[id: string]: MailMessage}>;

	// moveConversation(id: string, fid: string): Promise<void>;
	moveConversationToTrash(id: string): Promise<void>;
	deleteConversation(id: string): Promise<void>;
	markConversationAsRead(id: string, read: boolean): Promise<void>;
	markConversationAsSpam(id: string, spam: boolean): Promise<void>;

	saveDraft(msg: MailMessage): Promise<MailMessage>;
	addAttachment(msg: MailMessage, file: File): Promise<MailMessage>;
	sendMessage(msg: MailMessage): Promise<MailMessage>;
}

export type MailFolderOp = CreateMailFolderOp
	| MoveMailFolderOp
	| RenameMailFolderOp
	| DeleteMailFolderOp
	| EmptyMailFolderOp;

export type CreateMailFolderOp = {
	operation: 'create-mail-folder';
	parent: string;
	name: string;
	id: string;
};

export type MoveMailFolderOp = {
	operation: 'move-mail-folder';
	parent: string;
	id: string;
};

export type RenameMailFolderOp = {
	operation: 'rename-mail-folder';
	name: string;
	id: string;
};

export type DeleteMailFolderOp = {
	operation: 'delete-mail-folder';
	id: string;
};

export type EmptyMailFolderOp = {
	operation: 'empty-mail-folder';
	id: string;
};

export type TrashConversationOp = {
	operation: 'trash-conversation';
	id: string;
};

export type MarkConversationAsReadOp = {
	operation: 'mark-conversation-as-read';
	id: string;
	read: boolean;
};

export type DeleteConversationOp = {
	operation: 'delete-conversation';
	id: string;
};

export type MarkConversationAsSpamOp = {
	operation: 'mark-conversation-as-spam';
	id: string;
};
