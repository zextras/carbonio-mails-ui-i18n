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
import { handleSyncData as handleFolderSyncData } from './folders-slice';

const performSync = createAsyncThunk('sync/performSync', async (arg, { getState, dispatch }) => {
	const { status, token } = getState().sync;

	if (status === 'syncing') {
		console.log('Perform a Sync!');
		const {
			token: _token, folder, deleted, appt,
		} = await network.soapFetch(
			'Sync',
			{
				_jsns: 'urn:zimbraMail',
				typed: 1,
				token,
			},
		);
		if (!token || token !== _token) {
			await dispatch(handleFolderSyncData({
				firstSync: !token, token: _token, folder, deleted,
			}));
			// await dispatch(handleAppointmentsSyncData({
			// 	firstSync: !token, token: _token, folder, deleted, appt,
			// }));
		}
		return ({
			token: `${_token}`,
		});
	}

	return ({
		token,
	});
});

function performSyncPending(state, action) {
	if (state.status === 'idle' || state.status === 'init') {
		state.status = 'syncing';
	}
}

function performSyncFulfilled(state, { payload }) {
	const { token } = payload;
	state.token = token;
	state.status = state.intervalId > 0 ? 'idle' : 'stopped';
}

function performSyncRejected(state, action) {
	console.warn('performSyncRejected');
}

export const startSync = createAsyncThunk('sync/start', async (arg, { getState, dispatch }) => {
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

export const stopSync = createAsyncThunk('sync/stop', (arg, { getState, dispatch }) => {
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

function startStopSyncFulfilled(state, { payload }) {
	const { status, intervalId } = payload;
	state.status = status;
	state.intervalId = intervalId;
}

function setStatusR(state, { payload }) {
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
	extraReducers: {
		[performSync.pending]: produce(performSyncPending),
		[performSync.fulfilled]: produce(performSyncFulfilled),
		[performSync.rejected]: produce(performSyncRejected),
		[startSync.fulfilled]: produce(startStopSyncFulfilled),
		[stopSync.fulfilled]: produce(startStopSyncFulfilled),
	},
});

// export const {  } = syncSlice.actions;

export default syncSlice.reducer;
