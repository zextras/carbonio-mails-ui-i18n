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

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { network } from '@zextras/zapp-shell';
import { keyBy, map } from 'lodash';
import { createSelector } from 'reselect';
import {
	SearchRequest, SearchResponse, normalizeConversationFromSoap, SyncResponse,
} from '../soap';
import { ConversationMap, ConversationsStateType, StateType } from '../types/state';
import { selectFolderPath } from './folders-slice';

export const fetchConversations = createAsyncThunk<
	SearchResponse, { folderId: string; limit: number; before: Date }
>(
	'conversations/fetchConversations',
	async ({ folderId, limit = 50, before }, { getState }: any) => {
		const folderPath = selectFolderPath(getState(), folderId);

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
				sortBy: 'dateDesc',
				types: 'conversation',
				fetch: 'all',
				recip: 0,
				fullConversation: 1,
				query: queryPart.join(' '),
			},
		);
		return result as SearchResponse;
	},
);

function fetchConversationsPending(state: ConversationsStateType, action: any):
	ConversationsStateType {
	return { ...state, status: 'pending' };
}

function fetchConversationsFullFilled(
	state: ConversationsStateType,
	{ payload }: { payload: SearchResponse },
):
	ConversationsStateType {
	const conversations = keyBy(
		map(payload.c, normalizeConversationFromSoap),
		(e) => e.id,
	);

	return {
		...state,
		conversations: {
			...state.conversations,
			...conversations,
		},
		status: 'succeeded',
	};
	// TODO: how to save conversations????? in a map indexed by convId
	// https://redux.js.org/recipes/computing-derived-data
	// mapStateToProps
}

function fetchConversationsRejected(state: ConversationsStateType, action: any):
	ConversationsStateType {
	return { ...state, status: 'failed' };
}

function setCurrentFolderReducer(state: ConversationsStateType, { payload }: { payload: string }):
	ConversationsStateType {
	console.log('Setted', payload);
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
	{ payload }: { payload: SyncResponse }
):
	ConversationsStateType {
	// TODO
	return state;
}

export const conversationsSlice = createSlice<ConversationsStateType, {}>({
	name: 'conversations',
	initialState: {
		status: 'empty',
		conversations: {},
		currentFolder: {
			id: '2',
			hasMore: true,
		},
	} as ConversationsStateType,
	reducers: {
		handleSyncData: handleSyncDataReducer,
		setCurrentFolder: setCurrentFolderReducer,
	},
	extraReducers: (builder) => {
		builder.addCase(fetchConversations.pending, fetchConversationsPending);
		builder.addCase(fetchConversations.fulfilled, fetchConversationsFullFilled);
		builder.addCase(fetchConversations.rejected, fetchConversationsRejected);
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

export const selectConversationList = createSelector(
	[selectConversations, selectCurrentFolder],
	(conversations, folder) => {
		if (folder) {
			return Object.values(conversations)
				.filter((c) => c.parent.includes(folder));
		}
		return [];
	},
);
