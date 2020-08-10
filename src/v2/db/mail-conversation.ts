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

import { Participant } from './mail-db-types';
import { MailConversationMessage } from './mail-conversation-message';

export interface IMailConversation {
	/** Internal UUID */ _id?: string;
	/** Zimbra ID */ id?: string;
	parent: string[];
	date: number; // Date of the most recent message
	msgCount: number;
	unreadMsgCount: number;
	messages: MailConversationMessage[];
	participants: Participant[];
	subject: string;
	fragment: string;
	read: boolean;
	attachment: boolean;
	flagged: boolean;
	urgent: boolean;
}

export class MailConversation implements IMailConversation {
	/** Internal UUID */ _id?: string;

	/** Zimbra ID */ id?: string;

	parent: string[];

	date: number; // Date of the most recent message

	msgCount: number;

	unreadMsgCount: number;

	messages: MailConversationMessage[];

	participants: Participant[];

	subject: string;

	fragment: string;

	read: boolean;

	attachment: boolean;

	flagged: boolean;

	urgent: boolean;

	constructor({
		id,
		_id,
		parent,
		date,
		msgCount,
		unreadMsgCount,
		messages,
		participants,
		subject,
		fragment,
		read,
		attachment,
		flagged,
		urgent,
	}: IMailConversation) {
		this.id = id;
		this._id = _id;
		this.parent = parent;
		this.date = date;
		this.msgCount = msgCount;
		this.unreadMsgCount = unreadMsgCount;
		this.messages = messages;
		this.participants = participants;
		this.subject = subject;
		this.fragment = fragment;
		this.read = read;
		this.attachment = attachment;
		this.flagged = flagged;
		this.urgent = urgent;
	}
}
