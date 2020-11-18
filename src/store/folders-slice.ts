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
import { forEach, reduce } from 'lodash';
import { FoldersStateType, MailsFolderMap, StateType } from '../types/state';
import { sync, SyncResult } from './actions';

function syncFulfilled(state: FoldersStateType, { payload }: { payload: SyncResult }): void {
	reduce(
		payload.folders,
		(r, v, k) => {
			r[k] = v;
			return r;
		},
		state.folders,
	);
	payload.deleted.folders.forEach((id) => delete state.folders[id]);
}

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
	extraReducers: (builder) => {
		builder.addCase(sync.fulfilled, produce(syncFulfilled));
	},
});

export const folderSliceReducer = foldersSlice.reducer;

export function selectFolders({ folders }: StateType): MailsFolderMap {
	return folders ? folders.folders : {};
}

export function selectFoldersStatus({ folders }: StateType): string {
	return folders.status;
}
