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
import { normalizeConversationFromSoap } from '../commons/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../commons/normalize-message';
import { Conversation } from '../types/conversation';
import { MailMessage } from '../types/mail-message';
import {
	ConvActionRequest,
	ConvActionResponse,
	SearchConvRequest,
	SearchConvResponse,
	SearchRequest,
	SearchResponse,
	SyncResponse,
} from '../types/soap';
import {
	ConversationsFolderStatus,
	ConversationsInFolderState, ConversationsStateType, FolderToConversationsMap, StateType,
} from '../types/state';

/* eslint no-param-reassign: "off" */

interface FetchConversationParameters {
	folderId: string;
	limit: number;
	before?: Date;
}
interface FetchConversationsReturn {
	conversations: Record<string, Conversation>;
	hasMore: boolean;
	folderId: string;
}
export const search = createAsyncThunk<FetchConversationsReturn,
	FetchConversationParameters>(
		'conversations/search',
		async ({ folderId, limit = 100, before }, { getState }: any) => {
			const folder = folderId || selectCurrentFolder(getState());
			const queryPart = [
				`inId:"${folder}"`,
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
					wantContent: 'full',
					sortBy: 'dateDesc',
					query: queryPart.join(' '),
				},
			);
			return {
				conversations:
				{ ...keyBy(map(result.c || [], normalizeConversationFromSoap), (e) => e.id) },
				hasMore: result.more,
				folderId: folder,
			};
		},
		{
			condition: ({ folderId, before }: FetchConversationParameters, { getState }: any) => {
				const state = getState();
				const folder = folderId || selectCurrentFolder(state);
				const fetchStatus = state.conversations.cache[folderId].status;
				if (fetchStatus === 'complete'
					|| fetchStatus === 'pending'
					|| (fetchStatus === 'hasMore' && typeof before === 'undefined')) {
					return false;
				}
				return true;
			}
		}
	);

function fetchConversationsPending(
	state: ConversationsStateType,
	action: any,
): void {
	const folderId = action.meta.arg.folderId || state.currentFolder;
	state.cache[folderId].status = 'pending';
}

function fetchConversationsFullFilled(
	state: ConversationsStateType,
	{ payload }: { payload: FetchConversationsReturn },
): void {
	state.cache[payload.folderId].cache = {
		...state.cache[payload.folderId].cache,
		...payload.conversations
	};
	state.cache[payload.folderId].status = payload.hasMore ? 'hasMore' : 'complete';
}

function fetchConversationsRejected(
	state: ConversationsStateType,
	action: any,
): void {
	const folderId = action.meta.arg.folderId || state.currentFolder;
	state.cache[folderId].status = 'error';
}

interface SearchConvParameters {
	conversationId: string;
	folderId: string;
}

interface SearchConvReturn {
	hasMore: boolean;
	offset: string;
	messages: Array<MailMessage>;
	orderBy: string;
}

// TODO: in messagesSlice: control id something is expanded and add it to the map
export const searchConv = createAsyncThunk<SearchConvReturn, SearchConvParameters>(
	'conversations/searchConv',
	async ({ conversationId, folderId }) => {
		const result = await network.soapFetch<SearchConvRequest, SearchConvResponse>(
			'SearchConv',
			{
				_jsns: 'urn:zimbraMail',
				cid: conversationId,
				query: `inId: ${folderId}`,
				recip: '2',
				sortBy: 'dateDesc',
				offset: 0,
				fetch: 'all',
				needExp: 1,
				limit: 250,
				html: 1,
				max: 250000,
			},
		);
		return {
			messages: (result.m || []).map(normalizeMailMessageFromSoap),
			orderBy: result.orderBy,
			hasMore: result.more,
			offset: result.offset,
		};
	},
	{
		condition: ({ folderId, conversationId }: SearchConvParameters, { getState }: any) => {
			const state = getState();
			return !state.conversations.cache[folderId].cache[conversationId].messages[0].subject;
		}
	}
);

function searchConvFullFilled(
	state: ConversationsStateType,
	{ payload, meta }: any,
): void {
	state.cache[meta.arg.folderId].cache[meta.arg.conversationId].messages = payload.messages;
}

// TODO: add listener to this action on messages-slice
export const doConversationAction = createAsyncThunk<ConvActionResponse,
	{ conversationId: string; operation: 'move' | 'flag' | '!flag' | 'read' | '!read' | 'trash' | 'delete'; parent?: string }>(
		'conversations/doConversationAction',
		async ({ conversationId, operation, parent }) => {
			const result = await network.soapFetch<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
				{
					_jsns: 'urn:zimbraMail',
					action: {
						id: conversationId,
						op: operation,
						l: parent,
					},
				},
			);
			return result as ConvActionResponse;
		},
	);

function doConversationActionFullFilled(
	{ cache }: ConversationsStateType,
	{ payload, meta }: { payload: ConvActionResponse; meta: any },
): void {
	const { parent } = meta.arg;
	const { id, op } = payload.action;

	// eslint-disable-next-line guard-for-in,no-restricted-syntax
	for (const folder in cache) {
		const conversations = cache[folder];
		const conversation = conversations.cache[id];

		if (op.includes('flag')) {
			const newFlag = op.startsWith('!');
			conversation.flagged = newFlag;
			conversation.messages
				.forEach((msg) => {
					msg.flagged = newFlag;
				});
		}
		else if (op.includes('read')) {
			const newRead = op.startsWith('!');
			conversation.read = newRead;
			conversation.messages
				.forEach((msg) => {
					msg.read = newRead;
				});
		}
		else if (op === 'trash') {
			// TODO: add side effect to Trash
			cache['3'].status = 'hasChange';
			delete conversations.cache[id];
		}
		else if (op === 'delete') {
			delete conversations.cache[id];
		}
		else if (op === 'move') {
			conversation.messages
				.forEach((msg) => {
					msg.parent = parent;
				});
			cache[parent].cache[id] = conversations.cache[id];
			delete conversations.cache[id];
		}
	}
}

// function doMsgActionFullFilled(
// 	{ conversations }: ConversationsStateType,
// 	{ payload, meta }: { payload: MsgActionResponse; meta: any },
// ): void {
// 	const { parent } = meta.arg;
// 	const { id, op } = payload.action;
//
// 	const message = messages[id];
//
// 	if (op.includes('flag')) {
// 		const newFlag = op.startsWith('!');
// 		message.flagged = newFlag;
// 		conversations[message.conversation].flagged = newFlag;
// 	}
// 	else if (op.includes('read')) {
// 		const newRead = op.startsWith('!');
// 		message.read = newRead;
// 		conversations[message.conversation].read = newRead;
// 	}
// 	else if (op === 'trash') {
// 		message.parent = '3';
// 	}
// 	else if (op === 'delete') {
// 		conversations[message.conversation].messages = conversations[message.conversation].messages
// 			.filter((m) => m.id !== id);
// 		conversations[message.conversation].parent = conversations[message.conversation].messages
// 			.filter((m) => m.id !== id)
// 			.map((m) => m.parent);
// 		delete messages[id];
// 	}
// 	else if (op === 'move') {
// 		message.parent = parent;
//
// 		conversations[message.conversation].messages
// 			.filter((m) => m.id !== id)
// 			.forEach((m) => {
// 				m.parent = parent;
// 			});
//
// 		conversations[message.conversation].parent = conversations[message.conversation].messages
// 			.filter((m) => m.id !== id)
// 			.map((m) => m.parent);
// 	}
// }

export function setCurrentFolderReducer(
	state: ConversationsStateType,
	{ payload }: { payload: string }
):
	void {
	state.currentFolder = payload;
	if (!(payload in state.cache)) {
		state.cache[payload] = {
			cache: {},
			status: 'empty',
		};
	}
}

function handleSyncDataReducer(
	state: ConversationsStateType,
	{ payload }: { payload: SyncResponse },
): void {
	const { m, c, deleted } = payload;

	if (deleted && deleted.c) {
		const deletedConversationIds = deleted.c.ids.split(',');

		// eslint-disable-next-line guard-for-in,no-restricted-syntax
		for (const folder in state.cache) {
			deletedConversationIds.forEach((id) => delete state.cache[folder].cache[id]);
		}
	}
	if (deleted && deleted.m) {
		// TODO: handle
	}

	if (c) {
		const updatedConversations = c.map(normalizeConversationFromSoap);

		// eslint-disable-next-line guard-for-in,no-restricted-syntax
		for (const folder in state.cache) {
			console.log('caio');
		}
		// TODO: use GetConversations of invalidate cache for each folder that contains it
	}
	if (m) {
		// update
	}
}

export const conversationsSlice = createSlice<ConversationsStateType, {}>({
	name: 'conversations',
	initialState: {
		currentFolder: '2',
		cache: {
			2: {
				cache: {},
				status: 'empty',
			}
		} as FolderToConversationsMap,
	} as ConversationsStateType,
	reducers: {
		handleSyncData: produce(handleSyncDataReducer),
		setCurrentFolder: produce(setCurrentFolderReducer),
	},
	extraReducers: (builder) => {
		builder.addCase(search.pending, produce(fetchConversationsPending));
		builder.addCase(search.fulfilled, produce(fetchConversationsFullFilled));
		builder.addCase(search.rejected, produce(fetchConversationsRejected));
		builder.addCase(searchConv.fulfilled, produce(searchConvFullFilled));
		// builder.addCase(doConversationAction.fulfilled, produce(doConversationActionFullFilled));
		// builder.addCase(doMsgAction.fulfilled, produce(doMsgActionFullFilled));
	},
});

export default conversationsSlice.reducer;

function selectCache({ conversations }: StateType):
	Record<string, ConversationsInFolderState> {
	return conversations.cache;
}

export function selectCurrentFolder({ conversations }: StateType): string {
	return conversations.currentFolder;
}

export function selectConversationStatus(state: StateType): ConversationsFolderStatus {
	const currentFolder = selectCurrentFolder(state);
	return state.conversations.cache[currentFolder].status;
}

export const selectConversationList = createSelector(
	[selectCache, selectCurrentFolder],
	(conversations, folder) => (conversations[folder]
		? Object.values(conversations[folder].cache)
			.sort((a, b) => b.date - a.date)
		: []),
);
