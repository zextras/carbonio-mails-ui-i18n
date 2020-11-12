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
import produce from 'immer';
import { MailMessage } from '../types/mail-message';
import {
	GetMsgRequest, GetMsgResponse, MsgActionRequest, MsgActionResponse
} from '../types/soap';
import {
	MsgMap, MsgStateType, StateType
} from '../types/state';
import { getMsg, searchConv, SearchConvReturn } from './actions';

export const messagesSlice = createSlice<MsgStateType, {}>({
	name: 'messsages',
	initialState: {
		cache: {} as MsgMap,
	} as MsgStateType,
	reducers: {
	},
	extraReducers: (builder) => {
		builder.addCase(getMsg.fulfilled, produce(getMsgFulfilled));
		builder.addCase(searchConv.fulfilled, produce(searchConvFullFilled));
	},
});

export default messagesSlice.reducer;

function getMsgFulfilled(
	{ cache }: MsgStateType,
	{ payload }: { payload: MailMessage },
): void {
	cache[payload.id] = payload;
}

function searchConvFullFilled(
	{ cache }: MsgStateType,
	{ payload }: { payload: SearchConvReturn },
): void {
	payload.messages
		.filter((m) => m.parts.length > 0)
		.forEach((m) => {
			cache[m.id] = m;
		});
}

export const doMsgAction = createAsyncThunk<MsgActionResponse,
	{ messageId: string; operation: 'move' | 'flag' | '!flag' | 'read' | '!read' | 'trash' | 'delete'; parent?: string }>(
		'conversations/doMsgAction',
		async ({ messageId, operation, parent }) => {
			const result = await network.soapFetch<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{
					_jsns: 'urn:zimbraMail',
					action: {
						id: messageId,
						op: operation,
						l: parent,
					},
				},
			);
			return result as MsgActionResponse;
		},
	);

export function selectMessages(state: StateType): MsgMap {
	return state.messages.cache;
}
