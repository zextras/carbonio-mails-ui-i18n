/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */
import {
	keys,
	map,
	reduce,
	differenceWith,
	isEqual,
	keyBy
} from 'lodash';
import { SoapFetch } from '@zextras/zapp-shell';
import {
	ICreateChange,
	IDatabaseChange
} from 'dexie-observable/api';
import {
	fetchMailConversationsById, normalizeParticipantsFromSoap,
	SyncResponse, SyncResponseConversation,
	SyncResponseMailFolder
} from '../soap';
import {
	MailConversationFromDb,
	MailConversationFromSoap
} from './mail-conversation';
import { MailsDb } from './mails-db';

function _folderReducer(r: string[], f: SyncResponseMailFolder): string[] {
	if (f.id === '3' || (f.view && f.view === 'conversation')) {
		if (f.c) {
			r.push(...f.c[0].ids.split(','));
		}
	}
	if (f.folder) {
		reduce<SyncResponseMailFolder, string[]>(
			f.folder,
			_folderReducer,
			r
		);
	}
	return r;
}

function extractAllConversationsForInitialSync(
	_fetch: SoapFetch,
	folders: Array<SyncResponseMailFolder>
): Promise<ICreateChange[]> {
	const cIds = reduce<SyncResponseMailFolder, string[]>(
		folders,
		_folderReducer,
		[]
	);
	return fetchMailConversationsById(
		_fetch,
		cIds
	)
		.then((conversation) => reduce<MailConversationFromSoap, ICreateChange[]>(
			conversation,
			(acc, v) => {
				acc.push({
					type: 1,
					table: 'conversations',
					key: undefined,
					obj: v
				});
				return acc;
			},
			[]
		));
}

export function processRemoteConversationsNotification(
	_fetch: SoapFetch,
	db: MailsDb,
	isInitialSync: boolean,
	changes: IDatabaseChange[],
	localChangesFromRemote: IDatabaseChange[],
	{
		c: conversations,
		deleted,
		folder
	}: SyncResponse
): Promise<IDatabaseChange[]> {
	if (isInitialSync) {
		// Extract all mails from all the folders
		return extractAllConversationsForInitialSync(_fetch, folder!);
	}

	const mappedConvs = keyBy<SyncResponseConversation>(conversations || [], 'id');
	const ids = keys(mappedConvs || []);

	const dbChanges: IDatabaseChange[] = [];

	return db.conversations.where('id').anyOf(ids).toArray()
		.then((dbConvsArray) => keyBy(dbConvsArray, 'id'))
		.then((dbConvs: {[id: string]: MailConversationFromDb}) => ({
			dbConvs,
			dbChangesUpdated: reduce<{[id: string]: MailConversationFromDb}, IDatabaseChange[]>(
				dbConvs,
				(acc: IDatabaseChange[], value: MailConversationFromDb) => {
					if (value.id && mappedConvs && mappedConvs[value.id]) {
						const obj: {[keyPath: string]: any | undefined} = {};
						if (mappedConvs[value.id].n) {
							obj.msgCount = mappedConvs[value.id].n;
						}
						if (mappedConvs[value.id].u) {
							obj.unreadMsgCount = mappedConvs[value.id].u;
						}
						if (mappedConvs[value.id].d) {
							obj.date = mappedConvs[value.id].d;
						}
						if (mappedConvs[value.id].su) {
							obj.subject = mappedConvs[value.id].su;
						}
						if (mappedConvs[value.id].fr) {
							obj.fragment = mappedConvs[value.id].fr;
						}

						obj.read = !(/u/.test(mappedConvs[value.id].f || ''));
						obj.attachment = /a/.test(mappedConvs[value.id].f || '');
						obj.flagged = /f/.test(mappedConvs[value.id].f || '');
						obj.urgent = /!/.test(mappedConvs[value.id].f || '');

						// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
						// @ts-ignore
						if (typeof mappedConvs[value.id].e !== 'undefined' && mappedConvs[value.id].e.length > 0) {
							obj.participants = map(mappedConvs[value.id].e, normalizeParticipantsFromSoap);
						}
						acc.push({
							type: 2,
							table: 'conversations',
							key: value._id,
							mods: obj
						});
					}
					return acc;
				},
				dbChanges
			)
		}))
		.then(({ dbChangesUpdated, dbConvs }) => {
			const remoteIds = differenceWith(ids, keys(dbConvs), isEqual);
			if (remoteIds.length > 0) {
				return fetchMailConversationsById(
					_fetch,
					remoteIds
				)
					.then((soapMails) => reduce<MailConversationFromSoap, IDatabaseChange[]>(
						soapMails,
						(acc, value) => {
							acc.push({
								type: 1,
								table: 'conversations',
								key: undefined,
								obj: value
							});
							return acc;
						},
						dbChangesUpdated
					));
			}
			return dbChangesUpdated;
		})
		.then((dbChangesUpdatedAndFetched: IDatabaseChange[]) => {
			if (deleted && deleted[0] && deleted[0].c) {
				return db.conversations.where('id').anyOf(deleted[0].c[0].ids.split(',')).toArray()
					.then((dbConvsArray) => keyBy(dbConvsArray, 'id'))
					.then((deletedConvs) => reduce<{ [key: string]: MailConversationFromDb }, IDatabaseChange[]>(
						deletedConvs || {},
						(acc: IDatabaseChange[], value: MailConversationFromDb) => {
							acc.push({
								type: 3,
								table: 'conversations',
								key: value._id,
							});
							return acc;
						},
						dbChangesUpdatedAndFetched
					));
			}
			return dbChangesUpdatedAndFetched;
		});
}
