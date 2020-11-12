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

import { MailConversationFromSoap } from '../db/mail-conversation';
import { MailMessageFromSoap } from '../db/mail-message';
import { MailsEditor } from './mails-editor';
import { MailsFolder } from './mails-folder';

export interface StateType {
	status: string;
	folders: FoldersStateType;
	editors: EditorsStateType;
	conversations: ConversationsStateType;
	sync: SyncStateType;
}

export interface FoldersStateType {
	status: string;
	loaded: boolean;
	folders: MailsFolderMap;
}

export interface EditorsStateType {
	status: string;
	editors: MailsEditorMap;
}

export interface ConversationsStateType {
	status: string;
	conversations: ConversationMap;
	messages: MessageMap;
	currentFolder: {
		id?: string;
		hasMore?: boolean;
	};
}

export interface SyncStateType {
	status: string;
	intervalId: number;
	token?: string;
}

export type MailsFolderMap = Record<string, MailsFolder>;

export type MailsEditorMap = Record<string, MailsEditor>;

export type ConversationMap = Record<string, MailConversationFromSoap>;

export type MessageMap = Record<string, MailMessageFromSoap>;
