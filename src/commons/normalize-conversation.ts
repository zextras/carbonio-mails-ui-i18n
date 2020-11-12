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

import { map } from 'lodash';
import { Conversation } from '../types/conversation';
import { MailMessage } from '../types/mail-message';
import { SoapConversation } from '../types/soap/soap-conversation';
import { normalizeMailMessageFromSoap, normalizeParticipantsFromSoap } from './normalize-message';

export function normalizeConversationFromSoap(c: SoapConversation): Conversation {
	const messages: MailMessage[] = c.m.map(normalizeMailMessageFromSoap);

	return {
		tags: [],
		id: c.id,
		date: c.d,
		msgCount: c.n,
		unreadMsgCount: c.u,
		messages,
		participants: map(c.e || [], normalizeParticipantsFromSoap),
		subject: c.su,
		fragment: c.fr,
		read: !(/u/.test(c.f || '')),
		attachment: /a/.test(c.f || ''),
		flagged: /f/.test(c.f || ''),
		urgent: /!/.test(c.f || ''),
	};
}
