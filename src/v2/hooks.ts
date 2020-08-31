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
import { useCallback, useMemo, useEffect, useReducer } from 'react';
import { BehaviorSubject } from 'rxjs';
import { filter, map, reduce, last } from 'lodash';
import { MailsFolder } from './db/mails-folder';
import { MailConversation } from './db/mail-conversation';
import { MailConversationMessage } from './db/mail-conversation-message';
import { Participant } from './db/mail-db-types';
import { MailMessage } from './db/mail-message';
import { CompositionState } from './edit/use-composition-data';

type ConversationInFolderState = {
	conversations: Array<MailConversation>;
	folder: MailsFolder | undefined;
	hasMore: boolean;
	isLoading: boolean;
}

type ResetAction = {
	type: 'reset';
}

type SetFolderAction = {
	type: 'set-folder';
	folder: MailsFolder;
}

type SetConversationsAction = {
	type: 'set-conversations';
	conversations: Array<MailConversation>;
}

type SetIsLoadingAction = {
	type: 'set-is-loading';
	isLoading: boolean;
	hasMore: boolean;
};

type LoadedMoreConversations = {
	type: 'loaded-more-conversations';
	conversations: Array<MailConversation>;
	hasMore: boolean;
};

type ConvInFolderReducerAction =
		ResetAction
	| SetFolderAction
	| SetConversationsAction
	| SetIsLoadingAction
	| LoadedMoreConversations
	;

function convInFolderInit(): ConversationInFolderState {
	return {
		conversations: [],
		folder: undefined,
		hasMore: false,
		isLoading: true
	};
}

function convInFolderReducer(state: ConversationInFolderState, action: ConvInFolderReducerAction): ConversationInFolderState {
	switch (action.type) {
		case 'set-folder':
			return ({
				...state,
				conversations: [],
				folder: action.folder
			});
		case 'set-conversations':
			return ({
				...state,
				conversations: action.conversations,
				// isLoading: false
			});
		case 'set-is-loading':
			return ({
				...state,
				hasMore: action.hasMore,
				isLoading: action.isLoading
			});
		case 'loaded-more-conversations':
			return ({
				...state,
				conversations: [...state.conversations, ...action.conversations],
				hasMore: action.hasMore,
				isLoading: false,
			});
		case 'reset':
			return convInFolderInit();
		default:
			throw new Error(`Action not handled.`);
	}
}

type UseConvsInFolderReturnType = {
	conversations: Array<MailConversation>;
	folder: MailsFolder | undefined;
	isLoading: boolean;
	loadMore?: () => Promise<void>;
	hasMore: boolean;
}

export function useConvsInFolder(folderId: string): UseConvsInFolderReturnType {
	const { db } = hooks.useAppContext();

	const [state, dispatch] = useReducer(convInFolderReducer, [], convInFolderInit);
	const loadMore = useCallback((folder?: MailsFolder) => new Promise<void>((resolve, reject) => {
		dispatch({ type: 'set-is-loading', isLoading: true, hasMore: false });
		((folder) ? Promise.resolve(folder) : db.folders.get(folderId))
			.then((f: MailsFolder) => {
				if (!f || !f.id) {
					dispatch({ type: 'set-is-loading', isLoading: false, hasMore: false });
					resolve();
				}
				else {
					db.conversations
						.where('parent')
						.equals(f.id)
						.reverse()
						.limit(1)
						.sortBy('date')
						.then(([conv]: [MailConversation]) => db.fetchMoreConv(f, conv))
						.then(([conversations, hasMore]: [Array<MailConversation>, boolean]) => {
							dispatch({ type: 'loaded-more-conversations', conversations, hasMore });
							resolve();
						});
				}
			});
	}), [db, folderId, dispatch]);

	useEffect(() => {
		dispatch({ type: 'set-is-loading', isLoading: true, hasMore: false });
		db.folders.get(folderId)
			.then((folder: MailsFolder) => {
				dispatch({ type: 'set-folder', folder });
				if (!folder || !folder.id) {
					dispatch({ type: 'set-is-loading', isLoading: false, hasMore: false });
					return;
				}
				db.conversations
					.where('parent')
					.equals(folder.id)
					.reverse()
					.sortBy('date')
					.then((conversations: MailConversation[]) => {
						dispatch({ type: 'set-conversations', conversations });
						/* if (conversations.length < 50) {
							return loadMore(folder);
						} */
						const lastConv = last(conversations);
						return db.checkHasMoreConv(folder, lastConv)
							.then((hasMore: boolean) => dispatch({ type: 'set-is-loading', isLoading: false, hasMore }));
					});
			});
	}, [db, folderId, dispatch, loadMore]);

	return {
		conversations: state.conversations,
		folder: state.folder,
		isLoading: state.isLoading,
		hasMore: state.hasMore,
		loadMore: !state.isLoading && state.hasMore ? loadMore : undefined
	};
}

export function useConversationMessages(conversationId: Array<MailConversationMessage>) {
	const { db } = hooks.useAppContext();

	const messagesQuery = useCallback(
		() => db.messages.where('conversation').equals(conversationId).toArray(),
		[conversationId, db.messages]
	);
	const [messages, loaded] = hooks.useObserveDb(messagesQuery, db);

	return { messages, loaded };
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
