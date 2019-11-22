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

import { ISoapResponseContent } from '@zextras/zapp-shell/lib/network/ISoap';
import { map } from 'lodash';
import {
	IMailContactSchm,
	IMailPartSchm,
	IMailSchm,
	MailContactType
} from './idb/IMailSchema';

export interface IGetFolderRequestData {
	folder: {
		l: string;
		depth?: number;
	};
}

export interface IGetFolderResponseData extends ISoapResponseContent {
	folder: Array<{
		folder: Array<ISoapFolderObj>;
	}>;
}

export type FolderView = 'document'|'appointment'|'message'|'contact'|'task';

export interface IGetMsgReq {
	m: {
		id: string;
	};
}

export interface IGetMsgResp extends ISoapResponseContent {
	m: Array<IMsgItemObj>;
}

export interface ISoapFolderObj {
	id: string;
	/** Parent ID */ l: string;
	name: string;
	view: FolderView;
	absFolderPath: string;
	/** Size */ s: number;
	/** Count of unread messages */ u: number;
	/** Count of non-folder items */ n: number;
	deletable: boolean;
}

export interface IMsgItemObj {
	id: string;
	/** Conversation id */ cid: string;
	/** Folder id */ l: string;
	/** Contacts */ e: Array<IMsgContactObj>;
	/** Fragment */ fr: string;
	/** Parts */ mp: Array<IMsgPartObj>;
	/** Flags */ f: string;
	// Flags. (u)nread, (f)lagged, has (a)ttachment, (r)eplied, (s)ent by me,
	// for(w)arded, calendar in(v)ite, (d)raft, IMAP-\Deleted (x), (n)otification sent,
	// urgent (!), low-priority (?), priority (+)
	/** Size */ s: number;
	/** Subject */ su: string;
	/** Date */ sd: number;
}

export interface IMsgContactObj {
	/** address */ a: string;
	/** display name */ d: string;
	/** type */ t:
		/**	from	*/ 'f' |
		/**	to	*/ 't' |
		/**	cc	*/ 'c' |
		/**	bcc	*/ 'b' |
		/**	reply-to	*/ 'r' |
		/**	sender	*/ 's' |
		/**	read-receipt-notification	*/ 'n' |
		/**	resent from	*/ 'rf'
	;
}

export interface IMsgPartObj {
	part: string;
	/**	Content Type	*/ ct: string;
	/**	Size	*/ s: number;
	/**	Content id (for inline images)	*/ ci: string;
	/**	Parts	*/ mp: Array<IMsgPartObj>;
	/**	Set if is the body of the message	*/ body?: 1;
	filename?: string;
	content: string;
}

function contactTypeToEnum(t: 'f'|'t'|'c'|'b'|'r'|'s'|'n'|'rf'): MailContactType {
	switch (t) {
		case 't':
			return MailContactType.to;
		case 'r':
			return MailContactType.replyTo;
		case 's':
			return MailContactType.sender;
		case 'n':
			return MailContactType.readReceiptNotification;
		case 'rf':
			return MailContactType.resentFrom;
		case 'b':
			return MailContactType.bcc;
		case 'c':
			return MailContactType.cc;
		case 'f':
			return MailContactType.from;
		default:
			throw new Error(`Mail contact type ${t} not recognized`);
	}
}

function normalizeMailParts(mp: Array<IMsgPartObj>): Array<IMailPartSchm> {
	return map(
		mp,
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		normalizeMailPartMapFn
	);
}

function normalizeMailPartMapFn(v: IMsgPartObj): IMailPartSchm {
	const ret: IMailPartSchm = {
		contentType: v.ct,
		size: v.s,
		parts: normalizeMailParts(v.mp || []),
		name: v.part,
	};
	if (v.filename) ret.filename = v.filename;
	if (v.content) ret.filename = v.content;
	return ret;
}

function normalizeMailContacts(e: Array<IMsgContactObj>): Array<IMailContactSchm> {
	return map(
		e,
		(v) => ({
			name: v.d,
			address: v.a,
			type: contactTypeToEnum(v.t)
		})
	);
}

export const normalizeMessage = (m: IMsgItemObj): IMailSchm => {
	const contacts: Array<IMailContactSchm> = normalizeMailContacts(m.e || []);
	const parts: Array<IMailPartSchm> = normalizeMailParts(m.mp || []);
	return {
		conversationId: m.cid,
		id: m.id,
		date: m.sd,
		size: m.s,
		folder: m.l,
		parts,
		fragment: m.fr,
		bodyPath: '',
		subject: m.su,
		contacts,
		read: /u/.test(m.f) // TODO: Fix here, sometimes is undefined and return true!
	};
};
