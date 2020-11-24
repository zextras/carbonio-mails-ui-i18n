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

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["state", conversation", "message", "cache", "status"] }] */

import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';
import { filter, forEach, valuesIn } from 'lodash';
import { Conversation } from '../types/conversation';
import { MailMessage } from '../types/mail-message';
import { MsgMap, MsgStateType, StateType } from '../types/state';
import {
	convAction,
	ConvActionResult,
	getConv,
	getMsg,
	msgAction,
	MsgActionResult,
	searchConv,
	SearchConvReturn,
	sync,
	SyncResult,
} from './actions';


function syncFulfilled(state: MsgStateType, { payload }: { payload: SyncResult }): void {
	const {
		messages, deleted,
	} = payload;

	forEach(messages,(msg) => {
		if (state.cache[msg.id]) {
			if (msg.parent !== '6') {
				state.cache[msg.id].flagged = msg.flagged;
				state.cache[msg.id].read = msg.read;
				state.cache[msg.id].urgent = msg.urgent;
				state.cache[msg.id].tags = msg.tags;
				state.cache[msg.id].parent = msg.parent;
				state.cache[msg.id].isDeleted = msg.isDeleted;
			}
			else {
				delete state.cache[msg.id];
			}
		}
	});

	forEach(deleted.messages, (msgId) => delete state.cache[msgId]);
}

function getMsgFulfilled(
	{ cache, status }: MsgStateType,
	{ payload }: { payload: MailMessage },
): void {
	status[payload.id] = 'complete';
	cache[payload.id] = payload;
}

function searchConvFulfilled(
	{ cache, status }: MsgStateType,
	{ payload }: { payload: SearchConvReturn },
): void {
	forEach(
		filter(payload.messages, (m) => m.parts.length > 0),
		(m) => {
			status[m.id] = 'complete';
			cache[m.id] = m;
		}
	);
}

function msgActionFulfilled(
	{ cache }: MsgStateType,
	{ payload, meta }: { payload: MsgActionResult; meta: any },
): void {
	const { operation, ids } = payload;
	forEach(ids,
		(id) => {
			const message = cache[id];
			if (message) {
				if (operation.includes('flag')) {
					message.flagged = !operation.startsWith('!');
				}
				else if (operation.includes('read')) {
					message.read = !operation.startsWith('!');
				}
				else if (operation === 'trash') {
					message.parent = '3';
				}
				else if (operation === 'delete') {
					delete cache[id];
				}
				else if (operation === 'move') {
					message.parent = meta.arg.parent;
				}
			}
		}
	);
}

function convActionFulfilled(
	{ cache }: MsgStateType,
	{ payload, meta }: { payload: ConvActionResult; meta: any },
): void {
	const { operation, ids } = payload;
	forEach(
		filter(
			valuesIn(cache),
			(m) => ids.includes(m.conversation)
		),
		(message) => {
			if (message) {
				if (operation.includes('flag')) {
					message.flagged = !operation.startsWith('!');
				}
				else if (operation.includes('read')) {
					message.read = !operation.startsWith('!');
				}
				else if (operation === 'trash') {
					message.parent = '3';
				}
				else if (operation === 'delete') {
					delete cache[message.id];
				}
				else if (operation === 'move') {
					message.parent = meta.arg.parent;
				}
			}
		});
}

function getConvFulfilled(
	{ cache, status }: MsgStateType,
	{ payload, meta }: { payload: Conversation; meta: any },
): void {
	forEach(
		filter(payload.messages, m => m.parts.length > 0),
		(m) => {
			cache[m.id] = m as MailMessage;
			status[m.id] = 'complete';
		});
}

export const messagesSlice = createSlice({
	name: 'messages',
	initialState: {
		cache: {} as MsgMap,
		status: {},
	} as MsgStateType,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(sync.fulfilled, produce(syncFulfilled));
		builder.addCase(getMsg.fulfilled, produce(getMsgFulfilled));
		builder.addCase(searchConv.fulfilled, produce(searchConvFulfilled));
		builder.addCase(msgAction.fulfilled, produce(msgActionFulfilled));
		builder.addCase(convAction.fulfilled, produce(convActionFulfilled));
		builder.addCase(getConv.fulfilled, produce(getConvFulfilled));
	},
});

export const messageSliceReducer = messagesSlice.reducer;

export function selectMessages(state: StateType): MsgMap {
	return state.messages.cache;
}
