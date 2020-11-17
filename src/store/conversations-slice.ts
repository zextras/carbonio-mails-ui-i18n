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

import { createSlice, createSelector } from '@reduxjs/toolkit';
import produce from 'immer';
import { uniq, cloneDeep } from 'lodash';
import { Conversation } from '../types/conversation';
import { MsgActionResponse, SearchConvRequest, SearchConvResponse } from '../types/soap';
import {
	ConversationsFolderStatus,
	ConversationsInFolderState, ConversationsStateType, FolderToConversationsMap, StateType,
} from '../types/state';
import {
	FetchConversationsReturn, fetchConversations, searchConv, ConvActionResult, SyncResult, sync,
	convAction, getConv
} from './actions';

/* eslint no-param-reassign: "off" */

export const conversationsSlice = createSlice<ConversationsStateType, {}>({
	name: 'conversations',
	initialState: {
		currentFolder: '2',
		cache: {
			2: {
				cache: {},
				status: 'empty',
			},
		} as FolderToConversationsMap,
	} as ConversationsStateType,
	reducers: {
		setCurrentFolder: produce(setCurrentFolderReducer),
	},
	extraReducers: (builder) => {
		builder.addCase(sync.fulfilled, produce(syncFulfilled));
		builder.addCase(fetchConversations.pending, produce(fetchConversationsPending));
		builder.addCase(fetchConversations.fulfilled, produce(fetchConversationsFulfilled));
		builder.addCase(fetchConversations.rejected, produce(fetchConversationsRejected));
		builder.addCase(searchConv.fulfilled, produce(searchConvFulfilled));
		builder.addCase(convAction.fulfilled, produce(convActionFulfilled));
		builder.addCase(getConv.fulfilled, produce(getConvFulfilled));
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

function fetchConversationsFulfilled(
	state: ConversationsStateType,
	{ payload, meta }: { payload: FetchConversationsReturn; meta: any },
): void {
	state.cache[meta.arg.folderId].cache = {
		...state.cache[meta.arg.folderId].cache,
		...payload.conversations,
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

function searchConvFulfilled(
	state: ConversationsStateType,
	{ payload, meta }: any,
): void {
	state.cache[meta.arg.folderId].cache[meta.arg.conversationId].messages = payload.messages;
}

function getMsgFulfilled(
	state: ConversationsStateType,
	{ payload, meta }: any,
): void {
	state.cache[meta.arg.folderId].cache[meta.arg.conversationId].messages = payload.messages;
}

function convActionFulfilled(
	{ cache }: ConversationsStateType,
	{ payload, meta }: { payload: ConvActionResult; meta: any },
): void {
	const { ids, operation } = payload;

	ids.forEach((id: string) => {
		// eslint-disable-next-line guard-for-in,no-restricted-syntax
		for (const folder in cache) {
			const conversations = cache[folder];
			const conversation = conversations.cache[id];

			if (conversation) {
				if (operation.includes('flag')) {
					const newFlag = operation.startsWith('!');
					conversation.flagged = newFlag;
					conversation.messages
						.forEach((msg) => {
							msg.flagged = newFlag;
						});
				}
				else if (operation.includes('read')) {
					const newRead = operation.startsWith('!');
					conversation.read = newRead;
					conversation.messages
						.forEach((msg) => {
							msg.read = newRead;
						});
				}
				else if (operation === 'trash') {
					if ('3' in cache) {
						conversations.cache[id].messages.forEach((m) => {
							m.parent = '3';
						});
						cache['3'].cache[id] = { ...conversations.cache[id] };
					}
					delete conversations.cache[id];
				}
				else if (operation === 'delete') {
					delete conversations.cache[id];
				}
				else if (operation === 'move') {
					const parent = meta.arg.payload;
					if (parent in cache) {
						conversations.cache[id].messages.forEach((m) => {
							m.parent = parent;
						});
						cache[parent].cache[id] = { ...conversations.cache[id] };
						// TODO: the view can be a little different, maybe it's better to resync
					}
					delete conversations.cache[id];
				}
			}
		}
	});
}

function msgActionFulfilled(
	{ cache }: ConversationsStateType,
	{ payload, meta }: { payload: MsgActionResponse; meta: any },
): void {
	// TODO: think and do
	// const { id, op } = payload.action;
	//
	// const msgConversation = null;
	//
	// // eslint-disable-next-line guard-for-in,no-restricted-syntax
	// for (const folder in cache) {
	//
	// }
	//
	// if (op.includes('flag')) {
	// 	const newFlag = op.startsWith('!');
	// 	message.flagged = newFlag;
	// 	conversations[message.conversation].flagged = newFlag;
	// }
	// else if (op.includes('read')) {
	// 	const newRead = op.startsWith('!');
	// 	message.read = newRead;
	// 	conversations[message.conversation].read = newRead;
	// }
	// else if (op === 'trash') {
	// 	message.parent = '3';
	// }
	// else if (op === 'delete') {
	// 	conversations[message.conversation].messages = conversations[message.conversation].messages
	// 		.filter((m) => m.id !== id);
	// 	conversations[message.conversation].parent = conversations[message.conversation].messages
	// 		.filter((m) => m.id !== id)
	// 		.map((m) => m.parent);
	// 	delete messages[id];
	// }
	// else if (op === 'move') {
	// 	const { parent } = meta.arg;
	// 	message.parent = parent;
	//
	// 	conversations[message.conversation].messages
	// 		.filter((m) => m.id !== id)
	// 		.forEach((m) => {
	// 			m.parent = parent;
	// 		});
	//
	// 	conversations[message.conversation].parent = conversations[message.conversation].messages
	// 		.filter((m) => m.id !== id)
	// 		.map((m) => m.parent);
	// }
}

export function setCurrentFolderReducer(
	state: ConversationsStateType,
	{ payload }: { payload: string },
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

function syncFulfilled(state: ConversationsStateType, { payload }: { payload: SyncResult }): void {
	const {
		messages, conversations, folders, deleted,
	} = payload;
	// delete cache for 'deleted folders'
	deleted.folders.forEach((folderId) => delete state.cache[folderId]);

	// delete deleted conversations (I've never seen this), should work
	deleted.conversations.forEach((id) => {
		Object.values(state.cache).forEach((folder) => {
			delete folder.cache[id];
		});
	});

	// delete deleted messages: works
	deleted.messages.forEach((id) => {
		Object.values(state.cache).forEach((folder) => {
			Object.keys(folder.cache).forEach((convId) => {
				const conv = folder.cache[convId];
				const index = conv.messages.findIndex((m) => m.id === id);
				if (index > -1) {
					delete conv.messages[index];
					conv.msgCount = conv.messages.length;
					if (conv.msgCount === 0) {
						delete folder.cache[convId];
					}
					else {
						conv.flagged = conv.messages.some((m) => m.flagged);
						conv.unreadMsgCount = conv.messages.filter((m) => !m.read).length;
						conv.urgent = conv.messages.some((m) => m.urgent);
						conv.fragment = conv.messages[0].fragment || conv.fragment;
						conv.subject = conv.messages[conv.msgCount - 1].subject || conv.subject;
						conv.tags = uniq(conv.messages.flatMap((m) => m.tags));
					}
				}
			});
		});
	});

	// edit edited messages
	messages.forEach((receivedMsg) => {
		Object.keys(state.cache).forEach((folderId) => {
			const folder = state.cache[folderId];

			if (folder.cache[receivedMsg.conversation]) {
				const conversation = folder.cache[receivedMsg.conversation];
				const indexMessage = conversation.messages.findIndex((msg) => msg.id === receivedMsg.id);

				if (indexMessage !== -1
					&& receivedMsg.parent === conversation.messages[indexMessage].parent
					&& receivedMsg.parent !== '6'
				) {
					const msg = conversation.messages[indexMessage];
					const {
						flagged, urgent, isDeleted, read, tags
					} = receivedMsg;
					conversation.messages[indexMessage] = {
						...msg, flagged, urgent, isDeleted, read, tags
					};

					// update its conversation
					conversation.flagged = conversation.messages.some((m) => m.flagged);
					conversation.unreadMsgCount = conversation.messages.filter((m) => !m.read).length;
					conversation.urgent = conversation.messages.some((m) => m.urgent);
					conversation.tags = uniq(conversation.messages.flatMap((m) => m.tags));
				}
			}
		});
	});
}

function getConvFulfilled(
	state: ConversationsStateType,
	{ payload: conv }: { payload: Conversation }
): void {
	Object.keys(state.cache).forEach((folderId) => {
		const folder = state.cache[folderId];

		delete folder.cache[conv.id];

		// the conversation can have a newId, so i must remove all conversations
		// whose messages appears in the received conversation
		Object.values(folder.cache)
			.filter((c) => conv.messages.map((m) => m.id).includes(c.messages[0].id))
			.forEach((c) => delete folder.cache[c.id]);

		if (conv.messages.map((m) => m.parent).includes(folderId)) {
			const myConv = cloneDeep(conv);

			switch (folderId) {
				case '3':
					myConv.messages = myConv.messages.filter((m) => m.parent !== '4');
					break;
				case '4':
					myConv.messages = myConv.messages.filter((m) => m.parent !== '3');
					break;
				default:
					myConv.messages = myConv.messages.filter((m) => m.parent === folderId || !m.isDeleted);
			}
			myConv.messages = myConv.messages.sort((a, b) => b.date - a.date);
			myConv.msgCount = myConv.messages.length;
			myConv.unreadMsgCount = myConv.messages.filter((m) => m.read).length;
			myConv.date = Math.max(...myConv.messages.filter((m) => m.parent === folderId)
				.map((m) => m.date));
			// TODO: maybe edit participants

			state.cache[folderId].cache[myConv.id] = myConv;
		}
	});
}

// function getConversation(conversationId: string): void {
// 	// https://files.zimbra.com/docs/soap_api/9.0.0/api-reference/index.html
// 	// https://files.zimbra.com/docs/soap_api/9.0.0/api-reference/zimbraMail/GetConv.html
//
// 	const result = await network.soapFetch<SearchConvRequest, SearchConvResponse>(
// 		'SearchConv',
// 		{
// 			_jsns: 'urn:zimbraMail',
// 			cid: conversationId,
// 			query: `inId: ${folderId}`,
// 			recip: '2',
// 			sortBy: 'dateDesc',
// 			offset: 0,
// 			fetch,
// 			needExp: 1,
// 			limit: 250,
// 			html: 1,
// 			max: 250000,
// 		},
// 	);
//
//
// }

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
