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

import { createAsyncThunk } from '@reduxjs/toolkit';
import { network } from '@zextras/zapp-shell';
import { reduce } from 'lodash';
import { normalizeConversationFromSoap } from '../../commons/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../commons/normalize-message';
import { Conversation } from '../../types/conversation';
import { Folder } from '../../types/folder';
import { IncompleteMessage } from '../../types/mail-message';
import { SyncRequest, SyncResponse, SyncResponseDeletedMap } from '../../types/soap';
import { MailsFolderMap } from '../../types/state';

export type SyncResult = {
	messages: IncompleteMessage[],
	folders: MailsFolderMap,
	conversations: Conversation[],
	token: string,
	deleted: SyncDeletedResult,
}

export type SyncDeletedResult = {
	conversations: string[],
	messages: string[],
	folders: string[],
}

export const sync = createAsyncThunk<SyncResult, void>(
	'sync',
	async (arg, { getState, dispatch }: any) => {
		const { token } = getState().sync;

		console.log('Perform a Sync!');
		const {
			token: _token, folder, deleted, m, c
		} : SyncResponse = await network.soapFetch<SyncRequest, SyncResponse>(
			'Sync',
			{
				_jsns: 'urn:zimbraMail',
				typed: 1,
				token,
			},
		);
		return ({
			token: `${_token}`,
			messages: (m || []).map(normalizeMailMessageFromSoap),
			conversations: (c || []).map(normalizeConversationFromSoap),
			folders: folder ? findFolders(folder[0]) : {},
			deleted: normalizeDeleted(deleted),
		});
	},
	{
		condition: (arg: void, { getState }: any) => !(getState().sync.status === 'syncing'),
	},
);

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

function normalizeDeleted(param?: SyncResponseDeletedMap): SyncDeletedResult {
	if(param) {
		return {
			conversations: param.c ? param.c.ids.split(',') : [],
			messages: param.m ? param.m.ids.split(',') : [],
			folders: param.folder ? param.folder.ids.split(',') : [],
		}
	}
	return {
		conversations: [],
		messages: [],
		folders: [],
	};
}
