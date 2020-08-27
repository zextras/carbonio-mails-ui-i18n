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
	forEach, map, reduce, trim
} from 'lodash';

import {
	SoapEmailMessageObj,
	SoapEmailMessagePartObj,
	SyncResponseMailFolder,
	normalizeParticipantsFromSoap
} from '../soap';
import { MailMessageFromSoap, MailMessagePart } from './mail-message';
import { MailsFolderFromSoap } from './mails-folder';


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

