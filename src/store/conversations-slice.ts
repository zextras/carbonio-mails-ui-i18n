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
import { normalizeConversationFromSoap } from '../commons/normalize-conversation';
import { Conversation } from '../types/conversation';
import {
	ConvActionRequest,
	ConvActionResponse,
	SyncResponse,
} from '../types/soap';
import {
	ConversationsFolderStatus,
	ConversationsInFolderState, ConversationsStateType, FolderToConversationsMap, StateType,
} from '../types/state';
import { FetchConversationsReturn, fetchConversations, searchConv } from './actions';

/* eslint no-param-reassign: "off" */

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
		builder.addCase(fetchConversations.pending, produce(fetchConversationsPending));
		builder.addCase(fetchConversations.fulfilled, produce(fetchConversationsFullFilled));
		builder.addCase(fetchConversations.rejected, produce(fetchConversationsRejected));
		builder.addCase(searchConv.fulfilled, produce(searchConvFullFilled));
		// builder.addCase(doConversationAction.fulfilled, produce(doConversationActionFullFilled));
		// builder.addCase(doMsgAction.fulfilled, produce(doMsgActionFullFilled));
	},
});

export default conversationsSlice.reducer;

function fetchConversationsPending(
	state: ConversationsStateType,
	action: any,
): void {
	const folderId = action.meta.arg.folderId || state.currentFolder;
	state.cache[folderId].status = 'pending';
}

function fetchConversationsFullFilled(
	state: ConversationsStateType,
	{ payload, meta }: { payload: FetchConversationsReturn; meta: any },
): void {
	state.cache[meta.arg.folderId].cache = {
		...state.cache[meta.arg.folderId].cache,
		...payload.conversations
	};
	state.cache[meta.arg.folderId].status = payload.hasMore ? 'hasMore' : 'complete';
}

function fetchConversationsRejected(
	state: ConversationsStateType,
	action: any,
): void {
	const folderId = action.meta.arg.folderId || state.currentFolder;
	state.cache[folderId].status = 'error';
}

function searchConvFullFilled(
	state: ConversationsStateType,
	{ payload, meta }: any,
): void {
	state.cache[meta.arg.folderId].cache[meta.arg.conversationId].messages = payload.messages;
}

function getMsgFullFilled(
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

export function selectConversationMap(state: StateType): Record<string, Conversation> {
	const currentFolder = selectCurrentFolder(state);
	return state.conversations.cache[currentFolder].cache;
}

export const selectConversationList = createSelector(
	[selectCache, selectCurrentFolder],
	(conversations, folder) => (conversations[folder]
		? Object.values(conversations[folder].cache)
			.sort((a, b) => b.date - a.date)
		: []),
);
