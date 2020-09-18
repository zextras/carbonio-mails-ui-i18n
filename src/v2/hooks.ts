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
import { useCallback, useEffect, useReducer } from 'react';
import { keys, groupBy } from 'lodash';
import { MailsFolder, MailsFolderFromDb } from './db/mails-folder';
import { MailConversationFromDb } from './db/mail-conversation';
import { MailMessageFromDb } from './db/mail-message';
import { AppContext } from './app-context';

type ConversationInFolderState = {
	folder: MailsFolderFromDb | undefined;
	hasMore: boolean;
	isLoading: boolean;
}

type ResetAction = {
	type: 'reset';
}

type SetFolderAction = {
	type: 'set-folder';
	folder: MailsFolderFromDb;
}

type SetIsLoadingAction = {
	type: 'set-is-loading';
	isLoading: boolean;
};

type LoadedMoreConversations = {
	type: 'loaded-more-conversations';
	hasMore: boolean;
};

type ConvInFolderReducerAction =
		ResetAction
	| SetFolderAction
	| SetIsLoadingAction
	| LoadedMoreConversations
	;

function convInFolderInit(): ConversationInFolderState {
	return {
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
				folder: action.folder
			});
		case 'set-is-loading':
			return ({
				...state,
				isLoading: action.isLoading
			});
		case 'loaded-more-conversations':
			return ({
				...state,
				hasMore: action.hasMore,
				isLoading: false
			});
		case 'reset':
			return convInFolderInit();
		default:
			throw new Error('Action not handled.');
	}
}

type UseConvsInFolderReturnType = {
	conversations: Array<MailConversationFromDb>;
	folder: MailsFolder | undefined;
	isLoading: boolean;
	loadMore?: () => Promise<void>;
	hasMore: boolean;
}

export function useConvsInFolder(folderId: string): UseConvsInFolderReturnType {
	const { db } = hooks.useAppContext<AppContext>();

	const [state, dispatch] = useReducer(convInFolderReducer, [], convInFolderInit);

	const loadMore = useCallback(
		(lastConv?: MailConversationFromDb) => new Promise<void>((resolve, reject) => {
			if (!state.folder) {
				resolve();
				return;
			}
			dispatch({ type: 'set-is-loading', isLoading: true });
			db.fetchMoreConv(state.folder, lastConv)
				.then((hasMore: boolean) => {
					dispatch({ type: 'loaded-more-conversations', hasMore });
					resolve();
				});
		}),
		[db, state.folder, dispatch]
	);

	useEffect(() => {
		let didCancel = false;
		dispatch({ type: 'set-is-loading', isLoading: true });
		db.folders.get(folderId)
			.then((folder?: MailsFolderFromDb) => {
				if (!folder || !folder.id) {
					return false;
				}
				if (!didCancel) {
					dispatch({ type: 'set-folder', folder });
					return db.checkHasMoreConv(folder);
				}
				return false;
			})
			.then((hasMore) => {
				if (!didCancel) {
					dispatch({ type: 'loaded-more-conversations', hasMore });
				}
			});
		return () => {
			didCancel = true;
		};
	}, [db, folderId, dispatch]);

	const conversationsQuery = useCallback(
		() => {
			if (!state.folder || !state.folder.id) {
				return Promise.resolve([]);
			}
			// dispatch({ type: 'set-is-loading', isLoading: true });
			return db.transaction('r', db.messages, db.conversations, () => db.messages
				.where('parent')
				.equals(state.folder!.id!)
				.toArray()
				.then((messages: MailMessageFromDb[]) => {
					const mappedMsgs = groupBy(messages, 'conversation');
					return keys(mappedMsgs);
				})
				.then((conversationsIds: Array<string>) => db.conversations
					.where('id')
					.anyOf(conversationsIds)
					.reverse()
					.sortBy('date')
					.then((conversations: MailConversationFromDb[]) => {
						// dispatch({ type: 'set-is-loading', isLoading: false });
						return conversations;
					})));
		},
		[state.folder, db]
	);
	const [conversations, loaded] = hooks.useObserveDb(conversationsQuery, db);

	return {
		conversations: conversations || [],
		folder: state.folder,
		isLoading: state.isLoading || !loaded,
		hasMore: state.hasMore,
		loadMore: (!state.isLoading && loaded && state.hasMore) ? loadMore : undefined
	};
}

export function useConversationMessages(conversationId: string) {
	const { db } = hooks.useAppContext<AppContext>();

	const messagesQuery = useCallback(
		() => db.messages.where('conversation').equals(conversationId).reverse().sortBy('date'),
		[conversationId, db.messages]
	);
	const [messages, loaded] = hooks.useObserveDb(messagesQuery, db);

	return { messages, loaded };
}

export function useConversation(conversationId: string) {
	const { db } = hooks.useAppContext<AppContext>();
	const conversationQuery = useCallback(
		() => db.conversations
			.where('id')
			.equals(conversationId)
			.or('_id')
			.equals(conversationId)
			.first(),
		[conversationId, db.conversations]
	);
	const [conversation, loaded] = hooks.useObserveDb(conversationQuery, db);

	return { conversation, loaded };
}

export function useMessage(messageId: string) {
	const { db } = hooks.useAppContext<AppContext>();
	const messageQuery = useCallback(
		() => db.messages
			.where('id')
			.equals(messageId)
			.or('_id')
			.equals(messageId)
			.first(),
		[messageId, db.messages]
	);
	const [message, loaded] = hooks.useObserveDb(messageQuery, db);

	return { message, loaded };
}

export function useFolder(folderId: string) {
	const { db } = hooks.useAppContext<AppContext>();
	const folderQuery = useCallback(
		() => db.folders
			.where('id')
			.equals(folderId)
			.or('_id')
			.equals(folderId)
			.first(),
		[folderId, db.folders]
	);
	const [folder, folderLoaded] = hooks.useObserveDb(folderQuery, db);

	return { folder, folderLoaded };
}