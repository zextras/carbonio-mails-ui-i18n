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

import { IIDBFolderSchmV1 } from '@zextras/zapp-shell/lib/idb/IShellIdbSchema';

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

export type IMailsIdb = IIDBFolderSchmV1 & {
	// mails: {
	// 	key: string;
	// 	value: IMailSchm;
	// 	indexes: {
	// 		folder: string;
	// 		conversation: string;
	// 	};
	// };
	// conversations: {
	// 	key: string;
	// 	value: IConvSchm;
	// 	indexes: {
	// 		folder: string;
	// 	};
	// };
};

export type IMailSchm = {
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
	attachment: boolean;
	flagged: boolean;
	urgent: boolean;
	/** Defines the path inside the parts of the mail */ bodyPath: string;
};

export type IConvSchm = {
	id: string;
	contacts: Array<IMailContactSchm>;
	messages: Array<string>;
	date: number;
	folder: Array<string>;
	subject: string;
	fragment: string;
	msgCount: number;
	unreadMsgCount: number;
	read: boolean;
	flagged: boolean;
	attachment: boolean;
	urgent: boolean;
};

export type IMailPartSchm = {
	contentType: string;
	size: number;
	content?: string;
	name: string;
	filename?: string;
	parts?: Array<IMailPartSchm>;
};

export type IMailContactSchm = {
	name?: string;
	address: string;
	type: MailContactType;
};
