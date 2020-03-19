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

import { Conversation, IMailFolderSchmV1, MailMessage } from './idb/IMailsIdb';
import { BehaviorSubject } from 'rxjs';
import { ConversationWithMessages, MailMessageWithFolder } from './context/ConversationFolderCtxt';
import { CompositionAttachment, CompositionData } from './components/compose/IuseCompositionData';

export interface IMailsService {
	getFolderById(id: string): Promise<IMailFolderSchmV1>;
	getFolderByPath(path: string): Promise<IMailFolderSchmV1>;
	getFolderObservableByPath(path: string): BehaviorSubject<undefined|IMailFolderSchmV1>;
	getFolderConversations(path: string, loadMore: boolean): Promise<[string[], { [id: string]: Conversation|ConversationWithMessages }]>;
	getConversation(id: string, resolveMails: boolean): Promise<Conversation|ConversationWithMessages>;
	getMessages(msgIds: string[], resolveFolders: boolean): Promise<{[id: string]: MailMessage|MailMessageWithFolder}>;
	markMessageAsRead(id: string, read: boolean): Promise<void>;
	markMessageAsSpam(id: string, spam: boolean): Promise<void>;
	moveMessageToTrash(id: string): Promise<void>;
	// createFolder(name: string, parent: string): Promise<void>;
	// moveFolder(id: string, newParent: string): Promise<void>;
	// renameFolder(id: string, name: string): Promise<void>;
	// deleteFolder(id: string): Promise<void>;
	// emptyFolder(id: string): Promise<void>;
	// moveConversation(id: string, fid: string): Promise<void>;
	moveConversationToTrash(id: string): Promise<void>;
	// deleteConversation(id: string): Promise<void>;
	markConversationAsRead(id: string, read: boolean): Promise<void>;
	markConversationAsSpam(id: string, spam: boolean): Promise<void>;
	// saveDraft(msg: MailMessage): Promise<MailMessage>;
	// addAttachment(msg: MailMessage, file: File): Promise<MailMessage>;
	// sendMessage(msg: MailMessage): Promise<MailMessage>;
	uploadAttachments(files: Array<File>): Promise<Array<CompositionAttachment>>;
	createDraft(): BehaviorSubject<string>;

	saveDraft(
		data: CompositionData,
		draftId: string,
		newAttachments?: Array<CompositionAttachment>
	): Promise<CompositionData>;
	sendDraft(
		data: CompositionData,
		draftId: string
	): Promise<void>;
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

export type TrashMessageOp = {
	operation: 'trash-message';
	id: string;
};

export type MarkConversationAsReadOp = {
	operation: 'mark-conversation-as-read';
	id: string;
	read: boolean;
};

export type MarkMessageAsReadOp = {
	operation: 'mark-message-as-read';
	id: string;
	read: boolean;
};

export type MarkMessageAsSpamOp = {
	operation: 'mark-message-as-spam';
	id: string;
	spam: boolean;
};

export type DeleteConversationOp = {
	operation: 'delete-conversation';
	id: string;
};

export type MarkConversationAsSpamOp = {
	operation: 'mark-conversation-as-spam';
	id: string;
};


export type SendMsgOp = {
	operation: 'send-mail';
	id: string;
};
