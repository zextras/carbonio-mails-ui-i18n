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
import {
	GetMsgResponse, MsgActionRequest, MsgActionResponse,
	normalizeMailMessageFromSoap,
} from '../soap';
import { MailMessage } from '../types/mail-message';
import { MsgMap, MsgStateType, StateType } from '../types/state';

export const getMsg = createAsyncThunk<MailMessage | null, { msgId: string }>(
	'messages/getMsg',
	async ({ msgId }, { getState }: any) => {
		if (msgId in selectMessages(getState())) {
			return null;
		}
		const result = await network.soapFetch<any, GetMsgResponse>(
			'GetMsg',
			{
				_jsns: 'urn:zimbraMail',
				html: 1,
				id: msgId,
				needExp: 1,
			},
		);
		const msg = result.m[0];
		return normalizeMailMessageFromSoap(msg);
	},
);

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



export const messagesSlice = createSlice<MsgStateType, {}>({
	name: 'messsages',
	initialState: {
		cache: {} as MsgMap,
	} as MsgStateType,
	reducers: {
	},
	extraReducers: (builder) => {
		builder.addCase(getMsg.fulfilled, produce(getMsgFulfilled));
	},
});

export default messagesSlice.reducer;

export function selectMessages(state: StateType): MsgMap {
	return state.messages.cache;
}

function getMsgFulfilled(
	{ cache }: MsgStateType,
	{ payload }: { payload?: MailMessage | null },
): void {
	if (payload) {
		cache[payload.id] = payload;
	}
}
