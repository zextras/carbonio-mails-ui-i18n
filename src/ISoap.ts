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

import {
	flattenDeep,
	map,
	reduce,
	trim
} from 'lodash';
import {
	Conversation,
	ConversationMailMessage,
	IMailFolderSchmV1,
	MailMessage, MailMessagePart,
	Participant,
	ParticipantType
} from './idb/IMailsIdb';

export type SoapConvObj = {
	id: string;
	/** Number of the messages */
	n: number;
	/** Number of the unread messages */
	u: number;
	/** Flags */
	f: string;
	/** Tag names (comma separated) */
	tn: string;
	/** Date (of the most recent message) */
	d: number;
	/** Messages */
	m: SoapConvMsgObj[];
	/** Email information for conversation participants */
	e: SoapEmailInfoObj[];
	/** Subject */
	su: string;
	/** Fragment */
	fr: string;
};

export type SoapConvMsgObj = {
	id: string;
	/** Parent folder */
	l: string;
	/** Size */
	s: string; // Should be a number, but api returns a string
	/** Date */
	d: string; // Should be a number, but api returns a string
	/** Flags */
	f: string;
};

export type SoapEmailMessagePartObj = {
	part: string;
	/**	Content Type	*/ ct: string;
	/**	Size	*/ s: number;
	/**	Content id (for inline images)	*/ ci: string;
	/**	Parts	*/ mp: Array<SoapEmailMessagePartObj>;
	/**	Set if is the body of the message	*/ body?: true;
	filename?: string;
	content: string;
};

export type SoapEmailMessageObj = {
	id: string;
	/** Conversation id */ cid: string;
	/** Folder id */ l: string;
	/** Contacts */ e: Array<SoapEmailInfoObj>;
	/** Fragment */ fr: string;
	/** Parts */ mp: Array<SoapEmailMessagePartObj>;
	/** Flags */ f: string;
	// Flags. (u)nread, (f)lagged, has (a)ttachment, (r)eplied, (s)ent by me,
	// for(w)arded, calendar in(v)ite, (d)raft, IMAP-\Deleted (x), (n)otification sent,
	// urgent (!), low-priority (?), priority (+)
	/** Size */ s: number;
	/** Subject */ su: string;
	/** Date */ d: number;
};

type SoapEmailInfoTypeObj = 'f'|'t'|'c'|'b'|'r'|'s'|'n'|'rf';

export type SoapEmailInfoObj = {
	/** Address */
	a: string;
	/** Display name */
	d: string;
	/** Type: (f)rom, (t)o, (c)c, (b)cc, (r)eply-to, (s)ender, read-receipt (n)otification, (rf) resent-from */
	t: SoapEmailInfoTypeObj;
	isGroup?: 0|1;
};

export type CreateMailFolderOpReq = {
	folder: {
		view: 'message';
		l: string;
		name: string;
	};
};

export type MoveMailFolderActionOpReq = {
	action: {
		l: string;
		id: string;
		op: 'move';
	};
};

export type RenameMailFolderActionOpReq = {
	action: {
		name: string;
		id: string;
		op: 'rename';
	};
};

export type DeleteMailFolderActionOpReq = {
	action: {
		id: string;
		op: 'delete';
	};
};

export type EmptyMailFolderActionOpReq = {
	action: {
		id: string;
		op: 'empty';
		recursive: true;
	};
};

export type BatchSoapReqData = {
	requestId: number;
};

export type SearchConvRequestDataObj = {
	offset: number;
	limit: number;
	query: string;
	cid: string;
	fetch: string;
	html: 1|0;
	needExp: 1|0;
	max: number;
	recip: string;
};

export type BatchedSearchConvRequestDataObj = SearchConvRequestDataObj & BatchSoapReqData;

export function calculateAbsPath(
	id: string,
	name: string,
	fMap: {[id: string]: IMailFolderSchmV1},
	parentId?: string
): string {
	let mName = name;
	let mParentId = parentId;
	if (fMap[id]) {
		mName = fMap[id].name;
		mParentId = fMap[id].parent;
	}

	if (!mParentId || mParentId === '1' || !fMap[mParentId]) {
		return `/${mName}`;
	}

	return `${calculateAbsPath(mParentId, fMap[mParentId].name, fMap, fMap[mParentId].parent)}/${mName}`;
}

export function normalizeMailMessageFromSoap(m: SoapEmailMessageObj): MailMessage {
	return {
		conversation: m.cid,
		id: m.id,
		date: m.d,
		size: m.s,
		parent: m.l,
		parts: map(
			m.mp || [],
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			normalizeMailPartMapFn
		),
		fragment: m.fr,
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		bodyPath: generateBodyPath(m.mp || []),
		subject: m.su,
		contacts: map(
			m.e || [],
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			normalizeParticipantsFromSoap
		),
		read: !(/u/.test(m.f || '')),
		attachment: /a/.test(m.f || ''),
		flagged: /f/.test(m.f || ''),
		urgent: /!/.test(m.f || ''),
	};
}

function normalizeConversationMessageFromSoap(
	[r1, r2]: [ConversationMailMessage[], string[]],
	m: SoapConvMsgObj
): [ConversationMailMessage[], string[]] {
	return [
		r1.concat({
			id: m.id,
			parent: m.l
		}),
		r2.concat(m.l)
	];
}

function participantTypeFromSoap(t: SoapEmailInfoTypeObj): ParticipantType {
	switch (t) {
		case 'f': return ParticipantType.FROM;
		case 't': return ParticipantType.TO;
		case 'c': return ParticipantType.CARBON_COPY;
		case 'b': return ParticipantType.BLIND_CARBON_COPY;
		case 'r': return ParticipantType.REPLY_TO;
		case 's': return ParticipantType.SENDER;
		case 'n': return ParticipantType.READ_RECEIPT_NOTIFICATION;
		case 'rf': return ParticipantType.RESENT_FROM;
		default:
			throw new Error(`Participant type not handled: '${t}'`);
	}
}

function normalizeParticipantsFromSoap(e: SoapEmailInfoObj): Participant {
	return {
		type: participantTypeFromSoap(e.t),
		address: e.a,
		displayName: e.d
	};
}

export function normalizeConversationFromSoap(c: SoapConvObj): Conversation {
	const [messages, parent]: [ConversationMailMessage[], string[]] = reduce(
		c.m || [],
		normalizeConversationMessageFromSoap,
		[[], []]
	);

	return {
		id: c.id,
		date: c.d,
		msgCount: c.n,
		unreadMsgCount: c.u,
		messages,
		participants: map(
			c.e || [],
			normalizeParticipantsFromSoap
		),
		parent,
		subject: c.su,
		fragment: c.fr
	};
}

function normalizeMailPartMapFn(v: SoapEmailMessagePartObj): MailMessagePart {
	const ret: MailMessagePart = {
		contentType: v.ct,
		size: v.s,
		parts: map(
			v.mp || [],
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			normalizeMailPartMapFn
		),
		name: v.part,
	};
	if (v.filename) ret.filename = v.filename;
	if (v.content) ret.content = v.content;
	return ret;
}

function recursiveBodyPath(mp: Array<SoapEmailMessagePartObj>): Array<number> {
	// eslint-disable-next-line @typescript-eslint/no-use-before-define
	const result = flattenDeep(map(mp, bodyPathMapFn));
	return result;
}

function generateBodyPath(mp: Array<SoapEmailMessagePartObj>): string {
	const indexes = recursiveBodyPath(mp);
	const path = reduce(
		indexes,
		(partialPath: string, index: number): string => `parts[${index}].${partialPath}`,
		''
	);
	return trim(path, '.');
}


function bodyPathMapFn(v: SoapEmailMessagePartObj, idx: number): Array<number> {
	if (v.body) {
		return [idx];
	}
	if (v.mp) {
		const paths = recursiveBodyPath(v.mp);
		if (paths.length > 0) {
			paths.push(idx);
			return paths;
		}
	}
	return [];
}
