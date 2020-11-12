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

import { Participant } from './participant';

export type IncompleteMessage = {
	id: string;
	parent: string;
	conversation: string;
	participants: Array<Participant>;
	date: number;
	subject: string;
	fragment: string;
	read: boolean;
	size: number;
	attachment: boolean;
	flagged: boolean;
	urgent: boolean;
	tags: string[];
	send?: boolean;
	// TODO: tags (fields t e tn)
	// TODO: rev, s
}

export type MailMessagePart = {
	contentType: string;
	size?: number;
	content?: string;
	name?: string;
	filename?: string;
	parts?: Array<MailMessagePart>;
	ci?: string;
	disposition?: 'inline'|'attachment';
}

export type MailMessage = IncompleteMessage & {
	parts: Array<MailMessagePart>;
	/** Defines the path inside the parts of the mail */ bodyPath: string;
	parent: string;
}
