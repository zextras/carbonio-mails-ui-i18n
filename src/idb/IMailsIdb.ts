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
import { IFolderSchmV1 } from '@zextras/zapp-shell/lib/sync/IFolderSchm';

export type IMailFolderSchmV1 = IFolderSchmV1 & {
	synced: boolean;
};

type IIDBMailFolderSchmV1 = IIDBFolderSchmV1 & {
	folders: {
		value: IMailFolderSchmV1;
	};
};

export type IMailsIdb = IIDBMailFolderSchmV1 & {
	messages: {
		key: string;
		value: MailMessage;
		indexes: {
			parent: string;
			conversation: string;
		};
	};
	conversations: {
		key: string;
		value: Conversation;
		indexes: {
			parent: string;
		};
	};
};

export type MailMinimalData = {
	id: string;
	parent: string;
};

export type Conversation = {
	id: string;
	parent: string[];
	date: number; // Date of the most recent message
	msgCount: number;
	unreadMsgCount: number;
	messages: ConversationMailMessage[];
	participants: Participant[];
	subject: string;
	fragment: string;
	read: boolean;
	attachment: boolean;
	flagged: boolean;
	urgent: boolean;
};

export type ConversationMailMessage = MailMinimalData & {};

export enum ParticipantType {
	FROM = 'f',
	TO = 't',
	CARBON_COPY = 'c',
	BLIND_CARBON_COPY = 'b',
	REPLY_TO = 'r',
	SENDER = 's',
	READ_RECEIPT_NOTIFICATION = 'n',
	RESENT_FROM = 'rf'
}

export type Participant = {
	type: ParticipantType;
	address: string;
	displayName: string;
};

export type MailMessagePart = {
	contentType: string;
	size: number;
	content?: string;
	name: string;
	filename?: string;
	parts?: Array<MailMessagePart>;
	ci?: string;
	disposition?: 'inline'|'attachment';
};

export type MailMessage = MailMinimalData & {
	conversation: string;
	contacts: Array<Participant>;
	date: number;
	subject: string;
	fragment: string;
	read: boolean;
	parts: Array<MailMessagePart>;
	size: number;
	attachment: boolean;
	flagged: boolean;
	urgent: boolean;
	/** Defines the path inside the parts of the mail */ bodyPath: string;
};
