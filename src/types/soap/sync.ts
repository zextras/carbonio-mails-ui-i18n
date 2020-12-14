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

import { SoapConversation } from './soap-conversation';
import { ZimbraRequest } from './zimbra-request';

export type SyncRequest = ZimbraRequest & {
	typed: 0|1;
	token: string;
};

export type SyncResponse = ZimbraRequest & {
	md: number;
	token: string;
	more: boolean;
	deleted?: Array<SyncResponseDeletedMap>;
	folder?: Array<SyncResponseMailFolder>;
	m?: Array<SyncResponseMail>;
	c?: Array<SoapConversation>;
}

export type SyncResponseMailFolder = ISoapSyncFolderObj & {
	m: Array<{
		ids: string; // Comma-separated values
	}>;
	c: Array<{
		ids: string; // Comma-separated values
	}>;
	folder: Array<SyncResponseMailFolder>;
};

export type SyncResponseMail = {
	id: string;
	s: number;
	cid: string;
	d: number;
	l: string;
	md: number;
	ms: number;
	rev: number;
	f?: string;
	tn?: string;
	e: undefined;
	fr: undefined;
};

type SyncResponseDeletedMapRow = {
	ids: string;
};

export type SyncResponseDeletedMap = SyncResponseDeletedMapRow & {
	folder?: Array<SyncResponseDeletedMapRow>;
	m?: Array<SyncResponseDeletedMapRow>;
	c?: Array<SyncResponseDeletedMapRow>;
};

type ISoapSyncFolderObj = {
	absFolderPath: string;
	acl: any;
	activesyncdisabled: boolean;
	color: number;
	deletable: boolean;
	f: string;
	i4ms: number;
	i4next: number;
	id: string;
	l: string;
	luuid: string;
	md: number;
	mdver: number;
	meta: Array<any>;
	ms: number;
	n: number;
	name: string;
	retentionPolicy: Array<any>;
	rev: number;
	s: number;
	u: number;
	url: string;
	uuid: string;
	view: IFolderView;
	webOfflineSyncDays: number;
};

type IFolderView =
	'search folder'
	| 'tag'
	| 'conversation'
	| 'message'
	| 'contact'
	| 'document'
	| 'appointment'
	| 'virtual conversation'
	| 'remote folder'
	| 'wiki'
	| 'task'
	| 'chat';
