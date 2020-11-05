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
import produce from 'immer';
import { network } from '@zextras/zapp-shell';
import { selectFolderName } from './folders-slice';

export const fetchConversations = createAsyncThunk(
	'conversations/fetchConversations',
	async ({ folderId }, { getState }) => {
		const folderName = selectFolderName(getState(), folderId);
		const result = await network.soapFetch(
			'Search',
			{
				_jsns: 'urn:zimbraMail',
				limit: '500',
				needExp: 1,
				offset: 0,
				sortBy: 'dateDesc',
				types: 'conversation',
				fetch: 0,
				recip: 0,
				fullConversation: 0,
				query: `in: "${folderName}"`,
			}
		);
		console.log(result);
		return result;
	}
);

function fetchConversationsPending(state, action) {
	state.status = 'syncing';
}

function fetchConversationsFullFilled(state, action) {
	state.status = 'succeeded';
	// TODO: handle conversations
}

function fetchConversationsRejected(state, action) {
	state.status = 'failed';
	// state.error = action.error.message
}

export const conversationsSlice = createSlice({
	name: 'conversations',
	initialState: {
		status: 'idle',
		conversations: {},
	},
	extraReducers: {
		[fetchConversations.pending]: produce(fetchConversationsPending),
		[fetchConversations.fulfilled]: produce(fetchConversationsFullFilled),
		[fetchConversations.rejected]: produce(fetchConversationsRejected),
	},
});

export const { createLocalConversation } = conversationsSlice.actions;

export default conversationsSlice.reducer;

export function selectAllConversations({ conversations }) {
	return conversations ? conversations.conversations : [];
}

export function selectStatus({ conversations }) {
	return conversations.status;
}

export function selectConversation({ conversations }, { id }) {
	return conversations.conversations[id];
}
