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

import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import { network } from '@zextras/zapp-shell';
import produce from 'immer';
import { keyBy, map } from 'lodash';
import { MailConversationFromSoap } from '../db/mail-conversation';
import {
	SearchRequest, SearchResponse, normalizeConversationFromSoap, SyncResponse, GetConvRequest,
	GetConvResponse, normalizeMailMessageFromSoap
} from '../soap';
import {
	ConversationMap, ConversationsStateType, MessageMap, StateType
} from '../types/state';

export const fetchConversations = createAsyncThunk<SearchResponse | undefined,
	{ folderId: string; limit: number; before?: Date }>(
		'conversations/fetchConversations',
		async ({ folderId, limit = 50, before }, { getState }: any) => {
			const folderPath = getState().folders.folders[folderId].path;

			if (folderPath) {
				const queryPart = [
					`in:"${folderPath}"`,
				];
				if (before) queryPart.push(`before:${before.getTime()}`);
				const result = await network.soapFetch<SearchRequest, SearchResponse>(
					'Search',
					{
						_jsns: 'urn:zimbraMail',
						limit,
						needExp: 1,
						types: 'conversation',
						fetch: 'all',
						recip: 0,
						fullConversation: 1,
						query: queryPart.join(' '),
					},
				);
				return result as SearchResponse;
			}
			return undefined;
		},
	);

function fetchConversationsPending(state: ConversationsStateType, action: any):
	ConversationsStateType {
	return { ...state, status: 'pending' };
}

function fetchConversationsFullFilled(
	state: ConversationsStateType,
	{ payload }: { payload?: SearchResponse },
):
	ConversationsStateType {
	if (payload) {
		const conversations = keyBy(
			map(payload.c || [], normalizeConversationFromSoap),
			(e) => e.id,
		);

		return {
			...state,
			conversations: {
				...state.conversations,
				...conversations,
			},
			currentFolder: {
				...state.currentFolder,
				hasMore: payload.more,
			},
			status: 'succeeded',
		};
	}
	return state;
}

function fetchConversationsRejected(state: ConversationsStateType, action: any):
	ConversationsStateType {
	return { ...state, status: 'failed' };
}

export const getOneConversation = createAsyncThunk<GetConvResponse,
	{ conversationId: string }>(
		'conversations/getOneConversation',
		async ({ conversationId }) => {
			const result = await network.soapFetch<GetConvRequest, GetConvResponse>(
				'GetConv',
				{
					_jsns: 'urn:zimbraMail',
					c: [{
						id: conversationId,
						fetch: 'all',
						needExp: 1,
					}],
				},
			);
			return result as GetConvResponse;
		},
	);

function getOneConversationFullFilled(
	state: ConversationsStateType,
	{ payload }: { payload: GetConvResponse },
):
	ConversationsStateType {
	const conversations = {
		...state.conversations,
		...keyBy(payload.c.map(normalizeConversationFromSoap), (c) => c.id),
	};
	const messages = {
		...state.messages,
		...keyBy(payload.c.flatMap((c) => c.m.map(normalizeMailMessageFromSoap)), (c) => c.id)
	};
	return {
		...state,
		messages,
		conversations,
	};
}

function setCurrentFolderReducer(state: ConversationsStateType, { payload }: { payload: string }):
	ConversationsStateType {
	return {
		...state,
		currentFolder: {
			id: payload,
			hasMore: true,
		},
	};
}

function handleSyncDataReducer(
	state: ConversationsStateType,
	{ payload }: { payload: SyncResponse },
): void {
	const { m, c, deleted } = payload;

	if (deleted && deleted.c) {
		deleted.c.ids.split(',').forEach((id) => delete state.conversations[id]);
	}
	if (deleted && deleted.m) {
		deleted.m.ids.split(',').forEach((id) => delete state.messages[id]);
	}

	if (c) {
		// TODO: use GetConversations
	}
	if (m) {
		// TODO: use GetMsg ??
	}
}

export const conversationsSlice = createSlice<ConversationsStateType, {}>({
	name: 'conversations',
	initialState: {
		status: 'empty',
		conversations: {},
		messages: {},
		currentFolder: {
			id: '2',
			hasMore: true,
		},
	} as ConversationsStateType,
	reducers: {
		handleSyncData: produce(handleSyncDataReducer),
		setCurrentFolder: setCurrentFolderReducer,
	},
	extraReducers: (builder) => {
		builder.addCase(fetchConversations.pending, fetchConversationsPending);
		builder.addCase(fetchConversations.fulfilled, fetchConversationsFullFilled);
		builder.addCase(fetchConversations.rejected, fetchConversationsRejected);
		builder.addCase(getOneConversation.fulfilled, getOneConversationFullFilled);
	},
});

export default conversationsSlice.reducer;

export function selectConversationsStatus({ conversations }: StateType): string {
	return conversations.status;
}

export function selectFolderHasMoreConversations({ conversations }: StateType):
	boolean | undefined {
	return conversations.currentFolder.hasMore;
}

export function selectConversations({ conversations }: StateType): ConversationMap {
	return conversations.conversations;
}

export function selectCurrentFolder({ conversations }: StateType): string | undefined {
	return conversations.currentFolder.id;
}

export function selectMessages({ conversations }: StateType): MessageMap {
	return conversations.messages;
}

export const selectConversationList = createSelector(
	[selectConversations, selectCurrentFolder],
	(conversations, folder) => {
		if (folder) {
			return Object.values(conversations)
				.filter((c) => c.parent.includes(folder))
				.sort((a, b) => b.date - a.date);
		}
		return [];
	},
);
