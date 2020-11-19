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

import { uniq, uniqBy } from 'lodash';
import { Conversation } from '../types/conversation';
import { IncompleteMessage } from '../types/mail-message';
import { Participant } from '../types/participant';

export function filterMessages(messages: Array<IncompleteMessage>, folderId: string): Array<IncompleteMessage> {
	switch (folderId) {
		case '3':
			return  messages.filter((m) => m.parent !== '4');
		case '4':
			return messages.filter((m) => m.parent !== '3');
		default:
			return messages.filter((m) => m.parent !== '3' && m.parent !== '4');
	}
}

export function updateConversation(conversation: Conversation): void {
	conversation.msgCount = conversation.messages.length;
	conversation.flagged = conversation.messages.some((m) => m.flagged);
	conversation.unreadMsgCount = conversation.messages.filter((m) => !m.read).length;
	conversation.read = conversation.unreadMsgCount === 0;
	conversation.urgent = conversation.messages.some((m) => m.urgent);
	conversation.subject = conversation.messages[conversation.messages.length -1].subject || conversation.subject;
	conversation.fragment = conversation.messages[0].fragment || conversation.fragment;
	conversation.tags = uniq(conversation.messages.flatMap((m) => m.tags));
	conversation.participants = uniqBy(conversation.participants, (p: Participant) => p.address);
}

export function updateIncreasedConversation(conversation: Conversation, parentId: string): void {
	conversation.messages = uniqBy(conversation.messages, (m: IncompleteMessage) => m.id)
	conversation.messages.sort((a, b) => b.date - a.date)
	conversation.date = Math.max(...conversation.messages.filter((m) => m.parent === parentId)
		.map((m) => m.date));
	updateConversation(conversation);
}