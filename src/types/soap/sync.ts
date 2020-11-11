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
import ZimbraRequest from './zimbra-request';

export interface SyncRequest extends ZimbraRequest {
	typed: 0|1;
	token: string;
};

export interface SyncResponse extends ZimbraRequest {
	md: number;
	token: string;
	more: boolean;
	deleted?: SyncResponseDeletedMap;
	folder?: Array<SyncResponseMailFolder>;
	m?: Array<SyncResponseMail>;
	c?: Array<SoapConversation>;
}

export interface SyncResponseMailFolder extends ISoapSyncFolderObj {
	m: Array<{
		ids: string; // Comma-separated values
	}>;
	c: Array<{
		ids: string; // Comma-separated values
	}>;
	folder: Array<SyncResponseMailFolder>;
};

export type SyncResponseMail = {
	cid: string;
	d: number;
	id: string;
	l?: string;
	md: number;
	ms: number;
	rev: number;
	f?: string;
	// t?: string; //tag
	// tn?: string; //tagName
};

type SyncResponseDeletedMapRow = {
	ids: string;
};

export type SyncResponseDeletedMap = SyncResponseDeletedMapRow & {
	folder?: SyncResponseDeletedMapRow;
	m?: SyncResponseDeletedMapRow;
	c?: SyncResponseDeletedMapRow;
};

type ISoapSyncFolderObj = {
	absFolderPath: string;
	acl: {};
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
	meta: Array<{}>;
	ms: number;
	n: number;
	name: string;
	retentionPolicy: Array<{}>;
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
