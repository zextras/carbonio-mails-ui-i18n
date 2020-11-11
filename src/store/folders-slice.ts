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
import {
	reduce, isEmpty, forEach,
} from 'lodash';
import { Folder } from '../types/folder';
import { StateType, FoldersStateType, MailsFolderMap } from '../types/state';

export function findFolders(folder: any): MailsFolderMap {
	const toRet: MailsFolderMap = {};
	if ((folder.view && folder.view === 'message') || folder.id === '3') {
		toRet[folder.id] = {
			id: folder.id,
			uuid: folder.uuid,
			name: folder.name,
			path: folder.absFolderPath,
			parent: folder.l,
			parentUuid: folder.luuid,
			itemsCount: folder.n || 0,
			size: folder.s || 0,
			unreadCount: folder.u || 0,
			synced: true,
		} as Folder;
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

export const handleSyncData = createAsyncThunk('folders/handleSyncData', async ({
	firstSync, token, folder, deleted,
}: any, { dispatch }) => {
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

function setFoldersReducer(state: FoldersStateType, { payload }: any): void {
	reduce(
		payload,
		(r, v, k) => {
			r[k] = v;
			return r;
		},
		state.folders,
	);
}

function updateFoldersReducer(state: FoldersStateType, { payload }: any): void {
	reduce(
		payload,
		(r, v, k) => {
			r[k] = v;
			return r;
		},
		state.folders,
	);
}

function deleteFoldersReducer(state: FoldersStateType, { payload }: any): void {
	forEach(
		payload,
		(id) => state.folders[id] && delete state.folders[id],
	);
}

export const foldersSlice = createSlice({
	name: 'folders',
	initialState: {
		status: 'idle',
		folders: {} as MailsFolderMap,
	} as FoldersStateType,
	reducers: {
		setFolders: produce(setFoldersReducer),
		updateFolders: produce(updateFoldersReducer),
		deleteFolders: produce(deleteFoldersReducer),
	},
	extraReducers: {
	}
});

export default foldersSlice.reducer;

export function selectFolders({ folders }: StateType): MailsFolderMap {
	return folders ? folders.folders : {};
}

export function selectFoldersStatus({ folders }: StateType): string {
	return folders.status;
}
