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
import { MailsFolder } from './mails-folder';
import { ISoapFolderObj, SyncResponseMailFolder } from '../soap';
import { MailMessage } from './mail-message';
import { SoapEmailInfoObj, SoapEmailMessageObj, SoapEmailMessagePartObj } from '../../ISoap';
import { MailMessagePart, Participant, ParticipantType } from '../../idb/IMailsIdb';


type SoapEmailInfoTypeObj = 'f'|'t'|'c'|'b'|'r'|'s'|'n'|'rf';


function normalizeFolder(soapFolderObj: ISoapFolderObj): MailsFolder {
	return new MailsFolder({
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

export function normalizeMailsFolders(f: SyncResponseMailFolder): MailsFolder[] {
	if (!f) return [];
	let children: MailsFolder[] = [];
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

export function normalizeMailMessageFromSoap(m: SoapEmailMessageObj): MailMessage {
	return new MailMessage({
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
