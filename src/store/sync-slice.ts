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
import { SyncStateType } from '../types/state';
import { sync } from './actions';
import { handleSyncData as handleFolderSyncData } from './folders-slice';

function performSyncPending(state: SyncStateType, action: any): void {
	if (state.status === 'idle' || state.status === 'init') {
		state.status = 'syncing';
	}
}

function performSyncFulfilled(state: SyncStateType, { payload }: any): void {
	const { token } = payload;
	state.token = token;
	state.status = state.intervalId > 0 ? 'idle' : 'stopped';
}

function performSyncRejected(state: SyncStateType, action: any): void {
	console.warn('performSyncRejected');
}

export const startSync = createAsyncThunk('sync/start', async (arg, { getState, dispatch }: any) => {
	const { status, intervalId } = getState().sync;
	if (status === 'init' || status === 'stopped') {
		await dispatch(sync());
		const interval = setInterval((_dispatch) => {
			_dispatch(sync());
		}, 20000, dispatch);
		return ({
			status: 'idle',
			intervalId: interval,
		});
	}
	return ({
		status,
		intervalId,
	});
});

function startSyncFulfilled(state: SyncStateType, { payload }: any): void {
	const { status, intervalId } = payload;
	state.status = status;
	state.intervalId = intervalId;
}

function stopSyncReducer(state: SyncStateType): void {
	if (state.status === 'idle') {
		clearInterval(state.intervalId);
		state.status = 'stopped';
		state.intervalId = -1;
	}
	if (state.status === 'syncing') {
		clearInterval(state.intervalId);
		state.intervalId = -1;
	}
}

function setStatusReducer(state: SyncStateType, { payload }: any): void {
	state.status = payload.status;
}

export const syncSlice = createSlice({
	name: 'sync',
	initialState: {
		status: 'init',
		intervalId: -1,
		token: undefined,
	},
	reducers: {
		setStatus: produce(setStatusReducer),
		stopSync: produce(stopSyncReducer),
	},
	extraReducers: (builder) => {
		builder.addCase(sync.pending, produce(performSyncPending));
		builder.addCase(sync.fulfilled, produce(performSyncFulfilled));
		builder.addCase(sync.rejected, produce(performSyncRejected));
		builder.addCase(startSync.fulfilled, produce(startSyncFulfilled));
	},
});

export const { setStatus } = syncSlice.actions;

export default syncSlice.reducer;
