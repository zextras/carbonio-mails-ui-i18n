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
import { reduce, uniq } from 'lodash';
import { normalizeConversationFromSoap } from '../../commons/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../commons/normalize-message';
import { Conversation } from '../../types/conversation';
import { Folder } from '../../types/folder';
import { IncompleteMessage } from '../../types/mail-message';
import { SyncRequest, SyncResponse, SyncResponseDeletedMap } from '../../types/soap';
import { ConversationsInFolderState, MailsFolderMap } from '../../types/state';
import { getConv } from './get-conv';

export type SyncResult = {
	messages: IncompleteMessage[];
	folders: MailsFolderMap;
	conversations: Conversation[];
	token: string;
	deleted: SyncDeletedResult;
}

export type SyncDeletedResult = {
	conversations: string[];
	messages: string[];
	folders: string[];
}

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
	if (param) {
		return {
			conversations: param.c ? param.c[0].ids.split(',') : [],
			messages: param.m ? param.m[0].ids.split(',') : [],
			folders: param.folder ? param.folder[0].ids.split(',') : [],
		};
	}
	return {
		conversations: [],
		messages: [],
		folders: [],
	};
}

export const sync = createAsyncThunk<SyncResult, void>(
	'sync',
	async (arg, { getState, dispatch }: any) => {
		const { token } = getState().sync;

		console.log('Perform a Sync!');
		const {
			token: _token, folder: folders, deleted, m, c
		}: SyncResponse = await network.soapFetch<SyncRequest, SyncResponse>(
			'Sync',
			{
				_jsns: 'urn:zimbraMail',
				typed: 1,
				token,
			},
		);
		const messages = (m || []).map(normalizeMailMessageFromSoap);
		const conversations = (c || []).map(normalizeConversationFromSoap);
		const del = deleted ? normalizeDeleted(deleted[0]) : normalizeDeleted(undefined);

		let conversationsToAsk: string[] = [];

		// check whether a conversation needs to be downloaded
		messages.forEach((receivedMsg) => {
			Object.keys(getState().conversations.cache).forEach((folderId) => {
				const folder = getState().conversations.cache[folderId];

				// It means it's a new message of a new conversation
				if (!folder.cache[receivedMsg.conversation] && receivedMsg.parent === folderId) {
					conversationsToAsk.push(receivedMsg.conversation);
				}

				if (folder.cache[receivedMsg.conversation]) {
					const conversation = folder.cache[receivedMsg.conversation];
					const indexMessage = conversation.messages
						.findIndex((msg: IncompleteMessage) => msg.id === receivedMsg.id);

					// It means it's a new message of an already present conversation
					// or a draft (so the body can have changes so i must download it
					if (indexMessage === -1 || receivedMsg.parent === '6') {
						conversationsToAsk.push(receivedMsg.conversation);
					}
				}
			});
		});

		const editedConversations = conversations
			.map((co) => co.id)
			.filter((id) => Object.values(getState().conversations.cache).some((f: any) => f.cache[id]));

		conversationsToAsk = uniq(conversationsToAsk.concat(editedConversations));
		conversationsToAsk.forEach((convId) => dispatch(getConv({ convId })));

		return ({
			token: `${_token}`,
			messages,
			conversations,
			folders: folders ? findFolders(folders[0]) : {},
			deleted: del,
		});
	},
	{
		condition: (arg: void, { getState }: any) => !(getState().sync.status === 'syncing'),
	},
);
