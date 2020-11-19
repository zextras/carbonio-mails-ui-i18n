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
import { cloneDeep, uniq } from 'lodash';
import { filterMessages, updateConversation, updateIncreasedConversation } from '../commons/update-conversation';
import { Conversation } from '../types/conversation';
import {
	ConversationsFolderStatus,
	ConversationsInFolderState,
	ConversationsStateType,
	FolderToConversationsMap,
	StateType,
} from '../types/state';
import {
	convAction,
	ConvActionResult,
	fetchConversations,
	FetchConversationsReturn,
	getConv,
	msgAction,
	MsgActionResult,
	searchConv,
	sync,
	SyncResult,
} from './actions';

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
	delete state.pendingConversation[meta.arg.conversationId];
	const conversation = state.cache[meta.arg.folderId].cache[meta.arg.conversationId];
	if(conversation) {
		conversation.messages = payload.messages;
		updateConversation(conversation);
	}
}

function searchConvPending(
	state: ConversationsStateType,
	{ payload, meta }: any,
): void {
	state.pendingConversation[meta.arg.conversationId] = true;
}

function searchConvRejected(
	state: ConversationsStateType,
	{ payload, meta }: any,
): void {
	delete state.pendingConversation[meta.arg.conversationId];
}

function convActionFulfilled(
	{ cache }: ConversationsStateType,
	{ payload, meta }: { payload: ConvActionResult; meta: any },
): void {
	const { ids, operation } = payload;

	ids.forEach((id: string) => {
		Object.keys(cache).forEach(folderId => {
			const conversations = cache[folderId];
			const conversation = conversations.cache[id];

			if (conversation) {
				if (operation.includes('flag')) {
					const newFlag = !operation.startsWith('!');
					conversation.flagged = newFlag;
					conversation.messages
						.forEach((message) => {
							message.flagged = newFlag;
						});
				}
				else if (operation.includes('read')) {
					const newRead = !operation.startsWith('!');
					conversation.read = newRead;
					conversation.messages
						.forEach((message) => {
							message.read = newRead;
						});
				}
				else if (operation === 'delete') {
					delete conversations.cache[id];
				}
				else if (operation === 'move' || operation === 'trash') {
					const destination = operation === 'move' ? meta.arg.payload : '3';
					if(typeof cache[destination] === 'undefined') {
						cache[destination] = {
							status: 'empty',
							cache: {},
						}
					}
					conversation.messages.forEach(message => {
						message.parent = destination;
					});
					// this conversation is already in Destination folder
					if (cache[destination].cache[conversation.id]) {
						// i should update the message
						const destinationConv = cache[destination].cache[conversation.id];
						destinationConv.messages.concat(cloneDeep(conversation.messages));
						updateIncreasedConversation(conversation, destination);
					}
					else {
						// this conversation is not in Destination folder
						cache[destination].cache[conversation.id] = cloneDeep(conversation);
					}
					// delete the conversation in source folder
					if(destination !== folderId)
						delete cache[folderId].cache[conversation.id];
				}
			}
		});
	});
}

function msgActionFulfilled(
	{ cache }: ConversationsStateType,
	{ payload, meta }: { payload: MsgActionResult; meta: any },
): void {
	const { ids, operation } = payload;

	Object.keys(cache).forEach((folderId) => {
		const folder = cache[folderId];
		Object.values(folder.cache).forEach((conversation) => {
			if (conversation.messages.some((m) => ids.includes(m.id))) {
				const involvedMessages = conversation.messages.filter(m => ids.includes(m.id));
				if (operation.includes('flag')) {
					const newFlag = !operation.startsWith('!');
					involvedMessages.forEach(message => {
						message.flagged = newFlag;
					});
					conversation.flagged = conversation.messages.some(m => m.flagged);
				}
				else if (operation.includes('read')) {
					const newRead = !operation.startsWith('!');
					involvedMessages
						.forEach(message => {
							message.read = newRead;
						});
					updateConversation(conversation);
				}
				else if (operation.includes('tag')) {
					const { tag } = meta.arg;
					const action = !operation.startsWith('!');
					if (action) {
						involvedMessages.forEach(message => {
							message.tags.push(tag);
							message.tags = uniq(message.tags);
						});
					}
					else {
						involvedMessages.forEach(message => {
							message.tags = message.tags.filter(t => t !== tag);
						});
					}
					updateConversation(conversation);
				}
				else if (operation === 'delete') {
					conversation.messages = conversation.messages.filter(m => !ids.includes(m.id));

					if (!conversation.messages.some(m => m.parent === folderId))
						delete folder.cache[conversation.id];
					else
						updateConversation(conversation);
				}
				else if (operation === 'trash' || operation === 'move') {
					const destination = operation === 'trash' ? '3' : meta.arg.p;

					conversation.messages.filter(m => ids.includes(m.id)).forEach(message => {
						message.parent = destination;
					});

					if (folderId !== destination) {
						// if Destination folder is not downloaded, create it
						if (typeof cache[destination] === 'undefined')
							cache[destination] = { cache: {}, status: 'empty' };

						// i have to add this message / conversation to Destination

						// this conversation is already in Destination folder
						if (cache[destination].cache[conversation.id]) {
							// i should update the message
							const destinationConv = cache[destination].cache[conversation.id];
							involvedMessages.forEach(message => {
								message.parent = destination;
							});
							destinationConv.messages.concat(cloneDeep(involvedMessages));
							updateIncreasedConversation(conversation, destination);
						}
						else {
							// this conversation is not in Destination folder
							const newConv = cloneDeep(conversation);
							newConv.messages = filterMessages(newConv.messages, destination);
							updateConversation(newConv);

							cache[destination].cache[newConv.id] = newConv;
						}
						// update conversation in source folder
						conversation.messages = filterMessages(conversation.messages, folderId);
						if(conversation.messages.length === 0) delete folder.cache[conversation.id]
						else updateConversation(conversation)
					}
				}
			}
		});
	});
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
	if(deleted.messages.length > 0) {
		Object.values(state.cache).forEach((folder) => {
			Object.keys(folder.cache).forEach((convId) => {
				const conversation = folder.cache[convId];

				if(conversation.messages.some(m => deleted.messages.includes(m.id))) {
					conversation.messages = conversation.messages.filter(m => !deleted.messages.includes(m.id));

					if(conversation.messages.length === 0) delete folder.cache[convId];
					else updateConversation(conversation);
				}
			});
		});
	}


	// edit edited messages
	messages.forEach((receivedMsg) => {
		Object.keys(state.cache).forEach((folderId) => {
			const folder = state.cache[folderId];

			if (folder.cache[receivedMsg.conversation]) {
				const conversation = folder.cache[receivedMsg.conversation];
				if(conversation) {
					const indexMessage = conversation.messages.findIndex((msg) => msg && msg.id === receivedMsg.id);
					if (indexMessage !== -1) {
						const msg = conversation.messages[indexMessage];
						const {
							flagged, urgent, isDeleted, read, tags,
						} = receivedMsg;
						conversation.messages[indexMessage] = {
							...msg, flagged, urgent, isDeleted, read, tags,
						};
						updateConversation(conversation);
					}
				}
			}
		});
	});
}

function getConvFulfilled(
	state: ConversationsStateType,
	{ payload: conv }: { payload: Conversation },
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

			myConv.messages = filterMessages(myConv.messages, folderId)
			updateIncreasedConversation(myConv, folderId);

			state.cache[folderId].cache[myConv.id] = myConv;
		}
	});
}

export const conversationsSlice = createSlice({
	name: 'conversations',
	initialState: {
		currentFolder: '2',
		pendingConversation: {},
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
		builder.addCase(searchConv.pending, produce(searchConvPending));
		builder.addCase(searchConv.fulfilled, produce(searchConvFulfilled));
		builder.addCase(searchConv.rejected, produce(searchConvRejected));
		builder.addCase(convAction.fulfilled, produce(convActionFulfilled));
		builder.addCase(msgAction.fulfilled, produce(msgActionFulfilled));
		builder.addCase(getConv.fulfilled, produce(getConvFulfilled));
	},
});

export const conversationsSliceReducer = conversationsSlice.reducer;

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
