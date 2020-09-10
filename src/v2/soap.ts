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
	flattenDeep, map, reduce, trim
} from 'lodash';
import { SoapFetch } from '@zextras/zapp-shell';
import { MailsFolder } from './db/mails-folder';
import { Participant, ParticipantType } from './db/mail-db-types';
import { MailConversationFromSoap } from './db/mail-conversation';
import { MailMessageFromSoap, MailMessagePart } from './db/mail-message';
import { MailConversationMessage } from './db/mail-conversation-message';

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

export type BatchResponse = {
	CreateFolderResponse?: Array<BatchedResponse & CreateFolderResponse>;
	GetMsgResponse?: Array<BatchedResponse & GetMsgResponse>;
};

type GetMsgRequest = {
	m: { id: string; html: string };
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

type GetMsgResponse = {
	m: Array<SoapEmailMessageObj>;
}

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
	[r1, r2]: [MailConversationMessage[], string[]],
	m: SoapConvMsgObj
): [MailConversationMessage[], string[]] {
	return [
		r1.concat(
			new MailConversationMessage({
				id: m.id,
				parent: m.l
			})
		),
		r2.concat(m.l)
	];
}

function normalizeConversationFromSoap(c: SoapConvObj): MailConversationFromSoap {
	const [messages, parent]: [MailConversationMessage[], string[]] = reduce(
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

function recursiveBodyPath(mp: Array<SoapEmailMessagePartObj>): Array<number> {
	// eslint-disable-next-line @typescript-eslint/no-use-before-define
	return flattenDeep(map(mp, bodyPathMapFn));
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

function normalizeMailMessageFromSoap(m: SoapEmailMessageObj): MailMessageFromSoap {
	return new MailMessageFromSoap({
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
	});
}

export function fetchMailMessagesById(
	soapFetch: SoapFetch,
	ids: string[]
): Promise<{[key: string]: MailMessageFromSoap}> {
	if (ids.length < 1) return Promise.resolve({});
	const batchRequest: BatchRequest = {
		_jsns: 'urn:zimbra',
		onerror: 'continue'
	};
	batchRequest.GetMsgRequest = reduce<string, Array<BatchedRequest & GetMsgRequest>>(
		ids,
		(acc, id) => {
			acc.push({ _jsns: 'urn:zimbraMail', requestId: id, m: { id, html: '1' } });
			return acc;
		},
		[]
	);
	return soapFetch<BatchRequest, BatchResponse>(
		'Batch',
		batchRequest
	)
		.then(({ GetMsgResponse: getMsgResponse }) =>
			reduce<GetMsgResponse, {[key: string]: MailMessageFromSoap}>(
				getMsgResponse || [],
				(acc, { m }) => {
					const msg = normalizeMailMessageFromSoap(m[0]);
					acc[msg.id] = msg;
					return acc;
				},
				{}
			));
}

export function fetchConversationsInFolder(
	soapFetch: SoapFetch,
	f: MailsFolder,
	limit = 50,
	before?: Date
): Promise<[Array<MailConversationFromSoap>, Array<MailMessageFromSoap>, boolean]> {
	const queryPart = [
		`in:"${f.path}"`
	];
	if (before) queryPart.push(`before:${before.getTime()}`);
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
		.then(({ c, more }) => {
			const msgIds = reduce<SoapConvObj, Array<string>>(
				c,
				(acc, v) => {
					reduce(
						v.m,
						(acc2, v2) => {
							acc2.push(v2.id);
							return acc2;
						},
						acc
					);
					return acc;
				},
				[]
			);

			return fetchMailMessagesById(soapFetch, msgIds)
				.then((convsMessages: {[k: string]: MailMessageFromSoap}) => {
					return [
						reduce<SoapConvObj, Array<MailConversationFromSoap>>(
							c,
							(acc, v) => acc.concat(normalizeConversationFromSoap(v)),
							[]
						),
						reduce<
							{[k: string]: MailMessageFromSoap},
							MailMessageFromSoap[]
						>(convsMessages, (acc, msg) => [...acc, msg], []),
						more
					];
				});
		});
}
