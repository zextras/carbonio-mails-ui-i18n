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
import { map } from 'lodash';
import { ConversationMailMessage } from '../v1/idb/IMailsIdb';

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

	return { messages, loaded};
}

export function useConversation(conversationId: string) {
	const { db } = hooks.useAppContext();
	const conversationQuery = useCallback(
		() => db.conversations.where('id').equals(conversationId).or('_id').equals(conversationId).first(),
		[conversationId, db.conversations]
	);
	const [conversation, loaded] = hooks.useObserveDb(conversationQuery, db);

	return { conversation, loaded};
}

export function useMessage(messageId: string) {
	const { db } = hooks.useAppContext();
	const messageQuery = useCallback(
		() => db.messages.where('id').equals(messageId).or('_id').equals(messageId).first(),
		[messageId, db.messages]
	);
	const [message, loaded] = hooks.useObserveDb(messageQuery, db);

	return { message, loaded};
}
