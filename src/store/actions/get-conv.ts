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
import { Conversation } from '../../types/conversation';
import { GetConvRequest, GetConvResponse } from '../../types/soap';

export type GetConvParameters = {
	convId: string;
}

export const getConv = createAsyncThunk<Conversation, GetConvParameters>(
	'messages/getConv',
	async ({ convId }, { getState }: any) => {
		const result = await network.soapFetch<GetConvRequest, GetConvResponse>(
			'GetConv',
			{
				_jsns: 'urn:zimbraMail',
				c: {
					id: convId,
					html: 1,
					needExp: 1,
					fetch: 'all',
				}
			},
		);
		const conv = result.c[0];
		return normalizeConversationFromSoap(conv);
	},
);
