/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import { MailsEditor } from './mails-editor';
import { MailMessage } from './mail-message';
import { Conversation } from './conversation';
import { Folder } from './folder';

export type StateType = {
	status: string;
	folders: FoldersStateType;
	editors: EditorsStateType;
	conversations: ConversationsStateType;
	sync: SyncStateType;
	messages: MsgStateType;
}

export type SyncStateType = {
	status: string;
	intervalId: number;
	token?: string;
}

export interface EditorsStateType {
	status: string;
	editors: MailsEditorMap;
}

export type FoldersStateType = {
	status: string;
	folders: MailsFolderMap;
}

export type MsgStateType = {
	cache: MsgMap;
}

export type ConversationsStateType = {
	cache: FolderToConversationsMap;
	pendingConversation: Record<string, boolean>;
	currentFolder: string;
}

export type MailsFolderMap = Record<string, Folder>;

export type MailsEditorMap = Record<string, MailsEditor>;

export type MsgMap = Record<string, MailMessage>;

export type FolderToConversationsMap = Record<string, ConversationsInFolderState>;

export type ConversationsInFolderState = {
	cache: Record<string, Conversation>;
	status: ConversationsFolderStatus;
}

export type ConversationsFolderStatus = 'empty' | 'pending' | 'complete' | 'hasMore' | 'hasChange' | 'error';
