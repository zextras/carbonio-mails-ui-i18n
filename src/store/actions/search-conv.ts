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
import { normalizeMailMessageFromSoap } from '../../commons/normalize-message';
import { filterMessages } from '../../commons/update-conversation';
import { IncompleteMessage, MailMessage } from '../../types/mail-message';
import { SearchConvRequest, SearchConvResponse } from '../../types/soap';

export type SearchConvParameters = {
	conversationId: string;
	folderId: string;
	fetch: string;
}

export type SearchConvReturn = {
	hasMore: boolean;
	offset: string;
	messages: Array<MailMessage>;
	orderBy: string;
}

export const searchConv = createAsyncThunk<SearchConvReturn, SearchConvParameters>(
	'conversations/searchConv',
	async ({ conversationId, folderId, fetch = '0' }) => {
		const result = await network.soapFetch<SearchConvRequest, SearchConvResponse>(
			'SearchConv',
			{
				_jsns: 'urn:zimbraMail',
				cid: conversationId,
				query: `inId: ${folderId}`,
				recip: '2',
				sortBy: 'dateDesc',
				offset: 0,
				fetch,
				needExp: 1,
				limit: 250,
				html: 1,
				max: 250000,
			},
		);
		let messages = (result.m || []).map(normalizeMailMessageFromSoap);
		messages = filterMessages(messages, folderId);

		return {
			messages,
			orderBy: result.orderBy,
			hasMore: result.more,
			offset: result.offset,
		};
	},
	{
		condition: ({ folderId, conversationId }: SearchConvParameters, { getState }: any) =>
			!getState().conversations.cache[folderId].cache[conversationId].messages
				.every((m: IncompleteMessage) => m.subject)
	}
);
