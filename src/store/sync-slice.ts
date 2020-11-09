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
import { SyncResponse } from '../soap';
import { SyncStateType } from '../types/state';
import { handleSyncData as handleFolderSyncData } from './folders-slice';

const performSync = createAsyncThunk('sync/performSync', async (arg, { getState, dispatch }: any) => {
	const { status, token } = getState().sync;

	if (status === 'syncing') {
		console.log('Perform a Sync!');
		const syncResponse: SyncResponse = await network.soapFetch(
			'Sync',
			{
				_jsns: 'urn:zimbraMail',
				typed: 1,
				token,
			},
		);
		const {
			token: _token, folder, deleted
		} = syncResponse;
		if (!token || token !== _token) {
			await dispatch(handleFolderSyncData({
				firstSync: !token, token: _token, folder, deleted,
			}));
			dispatch({
				type: 'conversations/handleSyncData',
				payload: syncResponse,
			});
		}
		return ({
			token: `${_token}`,
		});
	}

	return ({
		token,
	});
});

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
		await dispatch(performSync());
		const interval = setInterval((_dispatch) => {
			_dispatch(performSync());
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

export const stopSync = createAsyncThunk('sync/stop', (arg, { getState, dispatch }: any) => {
	const { status, intervalId } = getState().sync;
	if (status === 'idle') {
		clearInterval(intervalId);
		return ({
			status: 'stopped',
			intervalId: -1,
		});
	}
	if (status === 'syncing') {
		clearInterval(intervalId);
		return ({
			status,
			intervalId: -1,
		});
	}
	return ({
		status,
		intervalId,
	});
});

function startStopSyncFulfilled(state: SyncStateType, { payload }: any): void {
	const { status, intervalId } = payload;
	state.status = status;
	state.intervalId = intervalId;
}

function setStatusR(state: SyncStateType, { payload }: any): void {
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
		setStatus: produce(setStatusR),
	},
	extraReducers: (builder) => {
		builder.addCase(performSync.pending, produce(performSyncPending));
		builder.addCase(performSync.fulfilled, produce(performSyncFulfilled));
		builder.addCase(performSync.rejected, produce(performSyncRejected));
		builder.addCase(startSync.fulfilled, produce(startStopSyncFulfilled));
		builder.addCase(stopSync.fulfilled, produce(startStopSyncFulfilled));
	},
});

// export const {  } = syncSlice.actions;

export default syncSlice.reducer;
