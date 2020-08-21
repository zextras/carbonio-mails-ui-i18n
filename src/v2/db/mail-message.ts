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

import { IMailMinimalData } from './mail-db-types';
import { MailMessagePart, Participant } from '../../idb/IMailsIdb';

interface IMailMessage extends IMailMinimalData {
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
}

export class MailMessage implements IMailMessage {
	_id?: string;

	id?: string;

	parent: string;

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

	constructor({
		_id,
		id,
		parent,
		conversation,
		contacts,
		date,
		subject,
		fragment,
		read,
		parts,
		size,
		attachment,
		flagged,
		urgent,
		bodyPath,
	}: IMailMessage) {
		this._id = _id;
		this.id = id;
		this.parent = parent;
		this.conversation = conversation;
		this.contacts = contacts;
		this.date = date;
		this.subject = subject;
		this.fragment = fragment;
		this.read = read;
		this.parts = parts;
		this.size = size;
		this.attachment = attachment;
		this.flagged = flagged;
		this.urgent = urgent;
		this.bodyPath = bodyPath;
	}
}
