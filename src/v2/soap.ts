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
	flattenDeep, forEach, map, reduce, trim
} from 'lodash';

import { MailsFolderFromDb, MailsFolderFromSoap } from './db/mails-folder';
import { SoapFetch } from '@zextras/zapp-shell';

import { Participant, ParticipantType } from './db/mail-db-types';
import { MailConversationFromSoap } from './db/mail-conversation';
import { MailMessageFromSoap, MailMessagePart } from './db/mail-message';


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

export type ISoapFolderObj = {
	absFolderPath: string;
	activesyncdisabled: boolean;
	deletable: boolean;
	folder?: Array<ISoapFolderObj>;
	i4ms: number;
	i4next: number;
	id: string;
	/** Parent ID */ l: string;
	luuid: string;
	ms: number;
	/** Count of non-folder items */ n: number;
	name: string;
	rev: number;
	/** Size */ s: number;
	/** Count of unread messages */ u?: number;
	uuid: string;
	view: IFolderView;
	webOfflineSyncDays: number;
}

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

export type SyncResponseConversation = {
		d: number;// date ms
		id: string;// id
		md: number;// modified date md
		ms: number;// modified sequence
		n?: number;// number of msgs
		u?: number;// number of unread msgs
		f?: string;// flags
		su?: string;// subject
		fr?: string;// fragment
		e?: Array<SoapEmailInfoObj>;
};

type SyncResponseDeletedMapRow = {
	ids: string;
};

export type SyncResponseDeletedMap = SyncResponseDeletedMapRow & {
	folder?: Array<SyncResponseDeletedMapRow>;
	m?: Array<SyncResponseDeletedMapRow>;
	c?: Array<SyncResponseDeletedMapRow>;
};

export type SyncRequest = {
	_jsns: 'urn:zimbraMail';
	typed: 0|1;
	token: string;
};

export type SyncResponse = {
	token: string;
	md: number;
	folder?: Array<SyncResponseMailFolder>;
	m?: Array<SyncResponseMail>;
	deleted?: Array<SyncResponseDeletedMap>;
	c?: Array<SyncResponseConversation>;
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
	GetMsgRequest?: Array<BatchedRequest & GetMsgRequest>;
};

export type GetMsgRequest = {
	m: Array<{
		id: string;
		html: string;
	}>;
};

export type GetConvRequest = {
	c: Array<{
		id: string;
		html: string;
		fetch: string;
	}>;
};

export type Jsns = {
	_jsns: 'urn:zimbraMail';
};

export type GetMsgResponse = {
	m: Array<SoapEmailMessageObj>;
};

export type GetConvResponse = {
	c: Array<SoapConvObj>;
};

export type SoapEmailMessagePartObj = {
	part: string;
	/**	Content Type	*/ ct: string;
	/**	Size	*/ s: number;
	/**	Content id (for inline images)	*/ ci: string;
	/** Content disposition */ cd?: 'inline'|'attachment';
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

export type BatchResponse = {
	CreateFolderResponse?: Array<BatchedResponse & CreateFolderResponse>;
	GetMsgResponse?: Array<BatchedResponse & GetMsgResponse>;
	GetConvResponse?: Array<BatchedResponse & GetConvResponse>;
};

type SoapEmailInfoTypeObj = 'f'|'t'|'c'|'b'|'r'|'s'|'n'|'rf';

type SoapEmailInfoObj = {
	/** Address */
	a: string;
	/** Display name */
	d: string;
	/** Type:
	 * (f)rom,
	 * (t)o,
	 * (c)c,
	 * (b)cc,
	 * (r)eply-to,
	 * (s)ender,
	 * read-receipt (n)otification,
	 * (rf) resent-from
	 */
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

type SearchRequest = {
	_jsns: 'urn:zimbraMail';
	sortBy: 'dateDesc';
	types: 'conversation';
	fullConversation: 0|1;
	needExp: 0|1;
	recip: 0|1;
	limit: number;
	query: string;
	fetch: 'all';
};

type SearchResponse = {
	c: SoapConvObj[];
	more: boolean;
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

export function normalizeParticipantsFromSoap(e: SoapEmailInfoObj): Participant {
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

export function normalizeConversationFromSoap(c: SoapConvObj): MailConversationFromSoap {
	const [messages, parent]: [MailConversationMessageMetadata[], string[]] = reduce(
		c.m || [],
		normalizeConversationMessageFromSoap,
		[[], []]
	);

	return new MailConversationFromSoap({
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

function bodyPathMapFn(v: SoapEmailMessagePartObj, idx: number): Array<number> {
	if (v.body) {
		return [idx];
	}
	if (v.mp) {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		const paths = recursiveBodyPath(v.mp);
		if (paths.length > 0) {
			paths.push(idx);
			return paths;
		}
	}
	return [];
}

function normalizeFolder(soapFolderObj: SyncResponseMailFolder): MailsFolderFromSoap {
	return new MailsFolderFromSoap({
		itemsCount: soapFolderObj.n,
		name: soapFolderObj.name,
		// _id: soapFolderObj.uuid,
		id: soapFolderObj.id,
		path: soapFolderObj.absFolderPath,
		unreadCount: soapFolderObj.u || 0,
		size: soapFolderObj.s,
		parent: soapFolderObj.l
	});
}

export function normalizeMailsFolders(f: SyncResponseMailFolder): MailsFolderFromSoap[] {
	if (!f) return [];
	let children: MailsFolderFromSoap[] = [];
	if (f.folder) {
		forEach(f.folder, (c: SyncResponseMailFolder) => {
			const child = normalizeMailsFolders(c);
			children = [...children, ...child];
		});
	}
	if (f.id === '3' || (f.view && f.view === 'message')) {
		return [normalizeFolder(f), ...children];
	}

	return children;
}

export function normalizeMailMessageFromSoap(m: SoapEmailMessageObj): MailMessageFromSoap {
	const obj = new MailMessageFromSoap({
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
		read: false,
		attachment: false,
		flagged: false,
		urgent: false
	});

	if (m.f) {
		obj.read = !(/u/.test(m.f));
		obj.attachment = /a/.test(m.f);
		obj.flagged = /f/.test(m.f);
		obj.urgent = /!/.test(m.f);
	}
	return obj;
}

function normalizeMailPartMapFn(v: SoapEmailMessagePartObj): MailMessagePart {
	const ret: MailMessagePart = {
		contentType: v.ct,
		size: v.s || 0,
		name: v.part,
	};
	if (v.mp) {
		ret.parts = map(
			v.mp || [],
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			normalizeMailPartMapFn
		);
	}
	if (v.filename) ret.filename = v.filename;
	if (v.content) ret.content = v.content;
	if (v.ci) ret.ci = v.ci;
	if (v.cd) ret.disposition = v.cd;
	return ret;
}

function recursiveBodyPath(mp: Array<SoapEmailMessagePartObj>): Array<number> {
	// eslint-disable-next-line @typescript-eslint/no-use-before-define
	return flattenDeep(map(mp, bodyPathMapFn));
}

export function fetchConversationsInFolder(
	soapFetch: SoapFetch,
	f: MailsFolderFromDb,
	limit = 50,
	before = new Date()
): Promise<[Array<MailConversationFromSoap>, boolean]> {
	const queryPart = [
		`in:"${f.path}"`
	];
	if (before.getTime() > 0) queryPart.push(`before:${before.getMilliseconds()}`);
	const searchReq: SearchRequest = {
		_jsns: 'urn:zimbraMail',
		sortBy: 'dateDesc',
		types: 'conversation',
		fullConversation: 1,
		needExp: 1,
		recip: 0,
		limit,
		query: queryPart.join(' '),
		fetch: 'all'
	};

	return soapFetch<SearchRequest, SearchResponse>(
		'Search',
		searchReq
	)
		.then(({ c, more }) => [
			reduce<SoapConvObj, Array<MailConversationFromSoap>>(
				c,
				(acc, v) => acc.concat(normalizeConversationFromSoap(v)),
				[]
			),
			more,
		]);
}

export function fetchMailMessagesById(
	soapFetch: SoapFetch,
	ids: string[]
): Promise<MailMessageFromSoap[]> {
	if (ids.length < 1) return Promise.resolve([]);
	const batchRequest: BatchRequest = {
		_jsns: 'urn:zimbra',
		onerror: 'continue'
	};
	batchRequest.GetMsgRequest = reduce<string, Array<BatchedRequest & GetMsgRequest>>(
		ids,
		(acc, id) => {
			acc.push({ _jsns: 'urn:zimbraMail', requestId: id, m: [{ id, html: '1' }] });
			return acc;
		},
		[]
	);
	return soapFetch<BatchRequest, BatchResponse>(
		'Batch',
		batchRequest
	)
		.then(({ GetMsgResponse: getMsgResponse }) =>

			reduce<GetMsgResponse, MailMessageFromSoap[]>(
				getMsgResponse || [],
				(acc, { m }) => {
					acc.push(normalizeMailMessageFromSoap(m[0]));
					return acc;
				},
				[]
			));
}

export function fetchMailConversationsById(
	_soapFetch: SoapFetch,
	ids: string[]
): Promise<MailConversationFromSoap[]> {
	if (ids.length < 1) return Promise.resolve([]);
	const batchRequest: BatchRequest & {GetConvRequest: Array<BatchedRequest & GetConvRequest>} = {
		_jsns: 'urn:zimbra',
		onerror: 'continue',
		GetConvRequest: []
	};
	reduce<string, Array<BatchedRequest & GetConvRequest>>(
		ids,
		(acc, id) => {
			acc.push({ _jsns: 'urn:zimbraMail', requestId: id, c: [{ id, html: '1', fetch: 'all' }] });
			return acc;
		},
		batchRequest.GetConvRequest
	);
	return _soapFetch<BatchRequest, BatchResponse>(
		'Batch',
		batchRequest
	)
		.then(({ GetConvResponse: getConvResponse }) =>
			reduce<GetConvResponse, MailConversationFromSoap[]>(
				getConvResponse,
				(acc, { c }) => {
					acc.push(normalizeConversationFromSoap(c[0]));
					return acc;
				},
				[]
			));
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
