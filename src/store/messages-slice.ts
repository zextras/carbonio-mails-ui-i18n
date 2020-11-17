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
import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';
import { MailMessage } from '../types/mail-message';
import { MsgMap, MsgStateType, StateType } from '../types/state';
import {
	getMsg, searchConv, SearchConvReturn, msgAction, MsgActionResult, ConvActionResult, convAction,
	SyncResult, sync
} from './actions';

export const messagesSlice = createSlice<MsgStateType, {}>({
	name: 'messages',
	initialState: {
		cache: {} as MsgMap,
	} as MsgStateType,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(sync.fulfilled, produce(syncFulfilled));
		builder.addCase(getMsg.fulfilled, produce(getMsgFulfilled));
		builder.addCase(searchConv.fulfilled, produce(searchConvFulfilled));
		builder.addCase(msgAction.fulfilled, produce(msgActionFulfilled));
		builder.addCase(convAction.fulfilled, produce(convActionFulfilled));
	},
});

export default messagesSlice.reducer;

function syncFulfilled(state: MsgStateType, { payload }: { payload: SyncResult }): void {
	const {
		messages, deleted,
	} = payload;

	messages.forEach((msg) => {
		if (state.cache[msg.id]) {
			if (msg.parent !== '6') {
				state.cache[msg.id].flagged = msg.flagged;
				state.cache[msg.id].read = msg.urgent;
				state.cache[msg.id].tags = msg.tags;
				state.cache[msg.id].parent = msg.parent;
				state.cache[msg.id].isDeleted = msg.isDeleted;
			}
			else {
				// TODO draft? the body can change and i don't know how to fetch
			}
		}
	});

	deleted.messages.forEach((msgId) => delete state.cache[msgId]);
}

function getMsgFulfilled(
	{ cache }: MsgStateType,
	{ payload }: { payload: MailMessage },
): void {
	cache[payload.id] = payload;
}

function searchConvFulfilled(
	{ cache }: MsgStateType,
	{ payload }: { payload: SearchConvReturn },
): void {
	payload.messages
		.filter((m) => m.parts.length > 0)
		.forEach((m) => {
			cache[m.id] = m;
		});
}

function msgActionFulfilled(
	{ cache }: MsgStateType,
	{ payload, meta }: { payload: MsgActionResult; meta: any },
): void {
	const { operation, ids } = payload;
	ids.forEach((id) => {
		const message = cache[id];
		if (message) {
			if (operation.includes('flag')) {
				message.flagged = !operation.startsWith('!');
			} else if (operation.includes('read')) {
				message.read = !operation.startsWith('!');
			} else if (operation === 'trash') {
				message.parent = '3';
			} else if (operation === 'delete') {
				delete cache[id];
			} else if (operation === 'move') {
				message.parent = meta.arg.parent;
			}
		}
	});
}

function convActionFulfilled(
	{ cache }: MsgStateType,
	{ payload, meta }: { payload: ConvActionResult; meta: any },
): void {
	const { operation, ids } = payload;
	Object.values(cache)
		.filter((m) => ids.includes(m.conversation))
		.forEach((message) => {
			if (message) {
				if (operation.includes('flag')) {
					message.flagged = !operation.startsWith('!');
				} else if (operation.includes('read')) {
					message.read = !operation.startsWith('!');
				} else if (operation === 'trash') {
					message.parent = '3';
				} else if (operation === 'delete') {
					delete cache[message.id];
				} else if (operation === 'move') {
					message.parent = meta.arg.parent;
				}
			}
		});
}

export function selectMessages(state: StateType): MsgMap {
	return state.messages.cache;
}
