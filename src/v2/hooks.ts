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

import { hooks } from '@zextras/zapp-shell';
import { useCallback, useMemo } from 'react';
import { BehaviorSubject } from 'rxjs';
import { reduce } from 'lodash';
import { ConversationMailMessage } from '../v1/idb/IMailsIdb';
import { Participant } from './db/mail-db-types';

export function useConversationsInFolder(folderId: string) {
	const { db } = hooks.useAppContext();

	const folderQuery = useMemo(
		() => () => db.folders.get(folderId),
		[db, folderId]
	);

	const [folder, folderLoaded] = hooks.useObserveDb(folderQuery, db);

	const folderContentObservable = useMemo(
		() => {
			if (folder) return db.getConvInFolder(folder);
			return new BehaviorSubject({
				conversations: [], hasMore: false, loading: true
			});
		},
		[db, folder]
	);

	const content = hooks.useBehaviorSubject(folderContentObservable);

	return { ...content, folder };
}

export function useConversationMessages(conversationId: Array<ConversationMailMessage>) {
	const { db } = hooks.useAppContext();

	const messagesQuery = useCallback(
		() => db.messages.where('conversation').equals(conversationId).toArray(),
		[conversationId, db.messages]
	);
	const [messages, loaded] = hooks.useObserveDb(messagesQuery, db);

	return { messages, loaded };
}

export function useDraft(messageId: string) {
	const { db } = hooks.useAppContext();

	const messageQuery = useCallback(
		() => db.messages.get(messageId),
		[messageId, db.messages]
	);
	const [message, loaded] = hooks.useObserveDb(messageQuery, db);

	return {
		draft: message ? {
			to: reduce<Participant, Array<{ value: string }>>(
				message.contacts,
				(acc: Array<{ value: string }>, contact: Participant) => {
					if (contact.type === 't') {
						return [...acc, { value: contact.address }];
					}
					return acc;
				},
				[]
			),
			cc: reduce<Participant, Array<{ value: string }>>(
				message.contacts,
				(acc: Array<{ value: string }>, contact: Participant) => {
					if (contact.type === 'c') {
						return [...acc, { value: contact.address }];
					}
					return acc;
				},
				[]
			),
			bcc: reduce<Participant, Array<{ value: string }>>(
				message.contacts,
				(acc: Array<{ value: string }>, contact: Participant) => {
					if (contact.type === 'b') {
						return [...acc, { value: contact.address }];
					}
					return acc;
				},
				[]
			),
			subject: message.subject || '',
			// TODO: replace with proper mail body
			text: message.fragment || ''
		} : {},
		loaded
	};
}
