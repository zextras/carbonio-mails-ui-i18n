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

import { map, reduce } from 'lodash';
import { MailsFolder } from './db/mails-folder';
import { Participant, ParticipantType } from './db/mail-db-types';
import { MailConversation } from './db/mail-conversation';

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

export type SyncResponseMailFolder = ISoapSyncFolderObj & {
	m: Array<{
		ids: string; // Comma-separated values
	}>;
	folder: Array<SyncResponseMailFolder>;
};

type SyncResponseDeletedMapRow = {
	ids: string;
};

export type SyncResponseDeletedMap = SyncResponseDeletedMapRow & {
	folder?: Array<SyncResponseDeletedMapRow>;
	m?: Array<SyncResponseDeletedMapRow>;
};

type SyncResponseMail = {
	cid: string;
	d: number;
	id: string;
	l: string;
	md: number;
	ms: number;
	rev: number;
};

export type SyncResponse = {
	token: string;
	md: number;
	folder?: Array<SyncResponseMailFolder>;
	m?: Array<SyncResponseMail>;
	deleted?: Array<SyncResponseDeletedMap>;
};

export type FolderActionRequest = {
	action: FolderActionRename |FolderActionMove | FolderActionDelete;
};

type FolderActionRename = {
	op: 'rename';
	id: string;
	name: string;
};

type FolderActionMove = {
	op: 'move';
	id: string;
	l: string;
};

type FolderActionDelete = {
	op: 'delete';
	id: string;
};

export type CreateFolderRequest = {};

export type CreateFolderResponse = {
	folder: Array<SyncResponseMailFolder>;
};

export type BatchedRequest = {
	_jsns: 'urn:zimbraMail';
	requestId: string;
};

export type BatchedResponse = {
	requestId: string;
};

export type BatchRequest = {
	_jsns: 'urn:zimbra';
	onerror: 'continue';
	CreateFolderRequest?: Array<BatchedRequest & CreateFolderRequest>;
	FolderActionRequest?: Array<BatchedRequest & FolderActionRequest>;
};

type SoapEmailInfoTypeObj = 'f'|'t'|'c'|'b'|'r'|'s'|'n'|'rf';

type SoapEmailInfoObj = {
	/** Address */
	a: string;
	/** Display name */
	d: string;
	/** Type: (f)rom, (t)o, (c)c, (b)cc, (r)eply-to, (s)ender, read-receipt (n)otification, (rf) resent-from */
	t: SoapEmailInfoTypeObj;
	isGroup?: 0|1;
};

type SoapConvMsgObj = {
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

type SoapConvObj = {
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

type MailConversationMessageMetadata = {
	id: string;
	parent: string;
};

function normalizeConversationMessageFromSoap(
	[r1, r2]: [MailConversationMessageMetadata[], string[]],
	m: SoapConvMsgObj
): [MailConversationMessageMetadata[], string[]] {
	return [
		r1.concat({
			id: m.id,
			parent: m.l
		}),
		r2.concat(m.l)
	];
}

function normalizeConversationFromSoap(c: SoapConvObj): MailConversation {
	const [messages, parent]: [MailConversationMessageMetadata[], string[]] = reduce(
		c.m || [],
		normalizeConversationMessageFromSoap,
		[[], []]
	);

	return new MailConversation({
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
		fragment: c.fr,
		read: !(/u/.test(c.f || '')),
		attachment: /a/.test(c.f || ''),
		flagged: /f/.test(c.f || ''),
		urgent: /!/.test(c.f || ''),
	});
}

export function fetchConversationsInFolder(
	fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
	f: MailsFolder,
	limit = 50,
	before = new Date()
): Promise<Array<MailConversation>> {
	const queryPart = [
		`in:"${f.path}"`
	];
	if (before.getMilliseconds() > -1) queryPart.push(`before:${before.getMilliseconds()}`);
	const searchReq = {
		Body: {
			SearchRequest: {
				_jsns: 'urn:zimbraMail',
				sortBy: 'dateDesc',
				types: 'conversation',
				fullConversation: 1,
				needExp: 1,
				recip: 0,
				limit,
				query: queryPart.join(' '),
				fetch: 'all'
			}
		}
	};
	return fetch(
		'/service/soap/SearchRequest',
		{
			method: 'POST',
			body: JSON.stringify(searchReq)
		}
	)
		.then((response) => response.json())
		.then((r) => {
			if (r.Body.Fault) throw new Error(r.Body.Fault.Reason.Text);
			else return r.Body.SearchResponse.c;
		})
		.then((r) => reduce<SoapConvObj, Array<MailConversation>>(
			r,
			(acc, v, k) => acc.concat(normalizeConversationFromSoap(v)),
			[]
		));
}
