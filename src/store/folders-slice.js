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
import { setLightness } from 'polished';
import { network } from '@zextras/zapp-shell';
import {
	reduce, isEmpty, forEach, filter,
} from 'lodash';
import { ZIMBRA_STANDARD_COLORS } from '../zimbra-standard-colors';

export function findFolders(folder) {
	const toRet = {};
	if (folder.view === 'message' || folder.id === '3') {
		const rgbColor = folder.rgb
			? {
				color: folder.rgb,
				background: setLightness(0.9, folder.rgb),
			}
			: ZIMBRA_STANDARD_COLORS[0];

		toRet[folder.id] = {
			checked: /#/.test(folder.f),
			color: folder.color
				? ZIMBRA_STANDARD_COLORS[folder.color]
				: rgbColor,
			zid: folder.id,
			name: folder.name,
			parentZid: folder.l,
			synced: true,
			owner: folder.owner, // It's specified only if It's not the current user
		};
	}
	return reduce(
		folder.folder || [],
		(r, f) => ({
			...r,
			...findFolders(f),
		}),
		toRet,
	);
}

export const fetchFolders = createAsyncThunk('folders/fetchFolders', async () => {
	const { folder } = await network.soapFetch(
		'Sync',
		{
			_jsns: 'urn:zimbraMail',
			typed: 1,
		},
	);
	return findFolders(folder[0]);
});

function fetchFoldersPending(state, action) {
	state.status = 'syncing';
}

function fetchFoldersFullFilled(state, action) {
	state.status = 'succeeded';
}

function fetchFoldersRejected(state, action) {
	state.status = 'failed';
	// state.error = action.error.message
}

function createFolderFullFilled(state, { payload }) {
	const [folders, tmpId] = payload;
	state.status = 'succeeded';
	delete state.folders[tmpId];
	reduce(
		folders,
		(r, v, k) => {
			r[k] = v;
			return r;
		},
		state.folders,
	);
}

function folderActionRejected(state, { meta, error }) {
	const { arg, requestId } = meta;
	state.folders[arg.zid || requestId].error = error;
}

function createLocalFolderReducer(state, { payload }) {
	state.folders[payload.zid] = payload;
}

export const createFolder = createAsyncThunk('folders/create', async ({ name, parent }, { dispatch, requestId }) => {
	dispatch({
		type: 'folders/createLocalFolder',
		payload: {
			checked: true,
			zid: requestId,
			name,
			parentZid: parent,
			synced: false,
		},
	});
	const { folder } = await network.soapFetch(
		'CreateFolder',
		{
			_jsns: 'urn:zimbraMail',
			folder: {
				rgb: ZIMBRA_STANDARD_COLORS[1],
				f: '#',
				l: parent,
				name,
				view: 'appointment',
			},
		},
	);
	return [findFolders(folder[0]), requestId];
});

export const handleSyncData = createAsyncThunk('folders/handleSyncData', async ({
	firstSync, token, folder, deleted,
}, { dispatch }) => {
	if (firstSync) {
		await dispatch({
			type: 'folders/setFolders',
			payload: findFolders(folder[0]),
		});
	}
	else {
		const updatedFolders = findFolders(folder ? folder[0] : []);
		if (!isEmpty(updatedFolders)) {
			await dispatch({
				type: 'folders/updateFolders',
				payload: updatedFolders,
			});
		}
		if (deleted) {
			await dispatch({
				type: 'folders/deleteFolders',
				payload: deleted[0].ids.split(','),
			});
		}
	}
});

function setFoldersReducer(state, { payload }) {
	state.folders = {};
	reduce(
		payload,
		(r, v, k) => {
			r[k] = v;
			return r;
		},
		state.folders,
	);
}

function updateFoldersReducer(state, { payload }) {
	reduce(
		payload,
		(r, v, k) => {
			r[k] = v;
			return r;
		},
		state.folders,
	);
}

function deleteFoldersReducer(state, { payload }) {
	forEach(
		payload,
		(id) => state.folders[id] && delete state.folders[id],
	);
}

export const checkUncheckFolder = createAsyncThunk('folders/checkUncheck', async ({ zid, checked }, { dispatch }) => {
	await network.soapFetch(
		'FolderAction',
		{
			_jsns: 'urn:zimbraMail',
			action: {
				op: checked ? 'check' : '!check',
				id: zid,
			},
		},
	);
	return ({
		zid,
		checked,
	});
});

function checkUncheckFolderPending(state, { meta }) {
	const { arg } = meta;
	state.folders[arg.zid].checked = arg.checked;
	state.folders[arg.zid].synced = false;
}

function checkUncheckFolderFulfilled(state, { payload }) {
	const { zid, checked } = payload;
	state.folders[zid].checked = checked;
	state.folders[zid].synced = true;
}

// TODO: adding types, update `notificationCounter`

export const foldersSlice = createSlice({
	name: 'folders',
	initialState: {
		status: 'idle',
		folders: {},
	},
	reducers: {
		createLocalFolder: produce(createLocalFolderReducer),
		setFolders: produce(setFoldersReducer),
		updateFolders: produce(updateFoldersReducer),
		deleteFolders: produce(deleteFoldersReducer),
	},
	extraReducers: {
		[handleSyncData.pending]: produce(fetchFoldersPending),
		[handleSyncData.fulfilled]: produce(fetchFoldersFullFilled),
		[handleSyncData.rejected]: produce(fetchFoldersRejected),
		[createFolder.pending]: produce((state, action) => {
		}),
		[createFolder.fulfilled]: produce(createFolderFullFilled),
		[createFolder.rejected]: produce(folderActionRejected),
		[checkUncheckFolder.pending]: produce(checkUncheckFolderPending),
		[checkUncheckFolder.fulfilled]: produce(checkUncheckFolderFulfilled),
		[checkUncheckFolder.rejected]: produce(folderActionRejected),
	},
});

export const { createLocalFolder } = foldersSlice.actions;

export default foldersSlice.reducer;

export function selectAllFolders({ folders }) {
	return folders ? folders.folders : [];
}

export function selectStatus({ folders }) {
	return folders.status;
}

export function selectFolder({ folders }, { id }) {
	return folders.folders[id];
}

export function selectAllCheckedFoldersQuery({ folders }) {
	return reduce(
		filter(folders.folders, 'checked'),
		(acc, c) => {
			acc.push(`inid:"${c.zid}"`);
			return acc;
		},
		[],
	).join(' OR ');
}
