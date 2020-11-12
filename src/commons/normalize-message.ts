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

import {
	flattenDeep, map, reduce, trim
} from 'lodash';
import { MailMessage, MailMessagePart } from '../types/mail-message';
import { SoapMailMessage, SoapMailMessagePart } from '../types/soap/soap-mail-message';
import { Participant, ParticipantRole } from '../types/participant';
import { SoapMailParticipant, SoapEmailParticipantRole } from '../types/soap/soap-mail-participant';

export function normalizeMailMessageFromSoap(m: SoapMailMessage): MailMessage {
	const obj = {
		conversation: m.cid,
		id: m.id,
		date: m.d,
		size: m.s,
		parent: m.l,
		fragment: m.fr,
		subject: m.su,
		participants: map(
			m.e || [],
			normalizeParticipantsFromSoap
		),
		read: !(/u/.test(m.f || '')),
		attachment: /a/.test(m.f || ''),
		flagged: /f/.test(m.f || ''),
		urgent: /!/.test(m.f || ''),
		tags: m.tn ? m.tn.split(',') : [],
		// TODO: maybe `deleted` flag
		parts: map(
			m.mp || [],
			normalizeMailPartMapFn
		),
		bodyPath: generateBodyPath(m.mp || []),
	} as MailMessage;

	return obj;
}

function normalizeMailPartMapFn(v: SoapMailMessagePart): MailMessagePart {
	const ret: MailMessagePart = {
		contentType: v.ct,
		size: v.s || 0,
		name: v.part,
	};
	if (v.mp) {
		ret.parts = map(
			v.mp || [],
			normalizeMailPartMapFn
		);
	}
	if (v.filename) ret.filename = v.filename;
	if (v.content) ret.content = v.content;
	if (v.ci) ret.ci = v.ci;
	if (v.cd) ret.disposition = v.cd;
	return ret;
}

export function generateBodyPath(mp: Array<SoapMailMessagePart>): string {
	const indexes = recursiveBodyPath(mp);
	const path = reduce(
		indexes,
		(partialPath: string, index: number): string => `parts[${index}].${partialPath}`,
		''
	);
	return trim(path, '.');
}

function recursiveBodyPath(mp: Array<SoapMailMessagePart>): Array<number> {
	return flattenDeep(map(mp, bodyPathMapFn));
}

function bodyPathMapFn(v: SoapMailMessagePart, idx: number): Array<number> {
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

export function normalizeParticipantsFromSoap(e: SoapMailParticipant): Participant {
	return {
		type: participantTypeFromSoap(e.t),
		address: e.a,
		name: e.d || e.a,
		fullName: e.p,
	};
}

function participantTypeFromSoap(t: SoapEmailParticipantRole): ParticipantRole {
	switch (t) {
		case 'f': return ParticipantRole.FROM;
		case 't': return ParticipantRole.TO;
		case 'c': return ParticipantRole.CARBON_COPY;
		case 'b': return ParticipantRole.BLIND_CARBON_COPY;
		case 'r': return ParticipantRole.REPLY_TO;
		case 's': return ParticipantRole.SENDER;
		case 'n': return ParticipantRole.READ_RECEIPT_NOTIFICATION;
		case 'rf': return ParticipantRole.RESENT_FROM;
		default:
			throw new Error(`Participant type not handled: '${t}'`);
	}
}
