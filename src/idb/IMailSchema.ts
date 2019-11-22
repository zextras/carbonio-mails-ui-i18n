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

import { DBSchema } from 'idb/lib/entry';

export enum MailContactType {
	from = 'from',
	to = 'to',
	cc = 'cc',
	bcc = 'bcc',
	replyTo = 'reply-to',
	sender = 'sender',
	readReceiptNotification = 'read-receipt-notification',
	resentFrom = 'resent-from'
}

export interface IMailIdbSchema extends DBSchema {
	folders: {
		key: string;
		value: IFolderSchm;
		indexes: {
			parent: string;
		};
	};
	mails: {
		key: string;
		value: IMailSchm;
		indexes: {
			folder: string;
			conversation: string;
		};
	};
}

interface IFolderSchm {
	id: string;
	parent: string;
	name: string;
	unread: boolean;
}

export interface IMailSchm {
	id: string;
	conversationId: string;
	folder: string;
	contacts: Array<IMailContactSchm>;
	date: number;
	subject: string;
	fragment: string;
	read: boolean;
	parts: Array<IMailPartSchm>;
	size: number;
	/** Defines the path inside the parts of the mail */ bodyPath: string;
}

export interface IMailPartSchm {
	contentType: string;
	size: number;
	content?: string;
	name: string;
	filename?: string;
	parts?: Array<IMailPartSchm>;
}

export interface IMailContactSchm {
	name?: string;
	address: string;
	type: MailContactType;
}
