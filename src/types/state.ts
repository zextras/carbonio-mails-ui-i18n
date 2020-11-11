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

import { MailMessage } from './mail-message';
import { Conversation } from './conversation';
import { Folder } from './folder';

export interface StateType {
	status: string;
	folders: FoldersStateType;
	conversations: ConversationsStateType;
	sync: SyncStateType;
	messages: MsgStateType;
}

export interface SyncStateType {
	status: string;
	intervalId: number;
	token?: string;
}

export interface FoldersStateType {
	status: string;
	folders: MailsFolderMap;
}

export interface MsgStateType {
	cache: MsgMap;
}

export interface ConversationsStateType {
	cache: FolderToConversationsMap;
	currentFolder: string;
}

export type MailsFolderMap = Record<string, Folder>;

export type MsgMap = Record<string, MailMessage>;

export type FolderToConversationsMap = Record<string, ConversationsInFolderState>;

export type ConversationsInFolderState = {
	cache: Record<string, Conversation>;
	status: ConversationsFolderStatus;
}

export type ConversationsFolderStatus = 'empty' | 'pending' | 'complete' | 'hasMore' | 'hasChange' | 'error';
