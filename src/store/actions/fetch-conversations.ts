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

import { createAsyncThunk } from '@reduxjs/toolkit';
import { network } from '@zextras/zapp-shell';
import { keyBy, map } from 'lodash';
import { normalizeConversationFromSoap } from '../../commons/normalize-conversation';
import { updateConversation, updateIncreasedConversation } from '../../commons/update-conversation';
import { Conversation } from '../../types/conversation';
import { SearchRequest, SearchResponse } from '../../types/soap';

export type FetchConversationsParameters = {
	folderId: string;
	limit: number;
	before?: Date;
}

export type FetchConversationsReturn = {
	conversations: Record<string, Conversation>;
	hasMore: boolean;
}

export const fetchConversations = createAsyncThunk<
	FetchConversationsReturn, FetchConversationsParameters
>(
	'fetchConversations',
	async ({ folderId, limit = 100, before }, { getState }: any) => {
		const queryPart = [
			`inId:${folderId}`,
		];
		if (before) queryPart.push(`before:${before.getTime()}`);
		const result = await network.soapFetch<SearchRequest, SearchResponse>(
			'Search',
			{
				_jsns: 'urn:zimbraMail',
				limit,
				needExp: 1,
				types: 'conversation',
				recip: '0',
				fullConversation: 1,
				wantContent: 'full',
				sortBy: 'dateDesc',
				query: queryPart.join(' '),
			},
		);
		const conversations = map(result.c || [], normalizeConversationFromSoap);
		conversations.forEach(updateConversation); // filter the conversation removing Trashed messages
		return {
			conversations:
				{ ...keyBy(conversations, (e) => e.id) },
			hasMore: result.more,
		};
	},
	{
		condition: ({ folderId, before }: FetchConversationsParameters, { getState }: any) => {
			const state = getState();
			const fetchStatus = state.conversations.cache[folderId].status;
			return !(fetchStatus === 'complete'
				|| fetchStatus === 'pending'
				|| (fetchStatus === 'hasMore' && typeof before === 'undefined'));
		}
	}
);
