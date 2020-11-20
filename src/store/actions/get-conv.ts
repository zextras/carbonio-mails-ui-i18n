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
import { normalizeConversationFromSoap } from '../../commons/normalize-conversation';
import { updateConversation } from '../../commons/update-conversation';
import { Conversation } from '../../types/conversation';
import { IncompleteMessage } from '../../types/mail-message';
import { GetConvRequest, GetConvResponse } from '../../types/soap';

export type GetConvParameters = {
	conversationId: string;
	fetch?: string;
	folderId?: string
}

export const getConv = createAsyncThunk<Conversation, GetConvParameters>(
	'messages/getConv',
	async ({ conversationId, fetch = 'all' }, { getState }: any) => {
		const result = await network.soapFetch<GetConvRequest, GetConvResponse>(
			'GetConv',
			{
				_jsns: 'urn:zimbraMail',
				c: {
					id: conversationId,
					html: 1,
					needExp: 1,
					fetch,
				}
			},
		);
		const conversation = normalizeConversationFromSoap(result.c[0]);
		updateConversation(conversation);
		return conversation;
	},
	{
		condition: ({ folderId, conversationId }: GetConvParameters, { getState }: any) => {
			if(!folderId) return true;
			if(getState().conversations.cache[folderId].cache[conversationId]
				&& getState().conversations.cache[folderId].cache[conversationId].messages
					.every((m: IncompleteMessage) => m.subject))
				return false;
			return getState().conversations.pendingConversation[conversationId] !== true;
		}
	}
);
