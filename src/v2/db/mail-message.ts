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

type Participant = {
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
		bodyPath
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

export class MailMessageFromSoap extends MailMessage {
	id: string;

	constructor({ id, ...rest }: IMailMessage & { id: string }) {
		super({ ...rest, id });
		this.id = id;
	}
}

export class MailMessageFromDb extends MailMessage {
	_id: string;

	constructor({ _id, ...rest }: IMailMessage & { _id: string }) {
		super({ ...rest, _id });
		this._id = _id;
	}
}
