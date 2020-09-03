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
	differenceWith,
	isEqual,
	keyBy,
	keys,
	map,
	reduce
} from 'lodash';
import { ICreateChange, IDatabaseChange } from 'dexie-observable/api';
import { MailsDb } from './mails-db';
import {
	SyncResponse,
	SyncResponseConversation,
	SyncResponseMailFolder,
	fetchMailConversationsById
} from '../soap';

import {
	MailConversationFromDb,
	MailConversationFromSoap
} from './mail-conversation';

function _folderReducer(r: string[], f: SyncResponseMailFolder): string[] {
	if (f.id === '3' || (f.view && f.view === 'message')) {
		if (f.m) {
			r.push(...f.m[0].ids.split(','));
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
	_fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
	folders: Array<SyncResponseMailFolder>
): Promise<ICreateChange[]> {
	const mIds = reduce<SyncResponseMailFolder, string[]>(
		folders,
		_folderReducer,
		[]
	);
	return fetchMailConversationsById(
		_fetch,
		mIds
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
	_fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
	db: MailsDb,
	isInitialSync: boolean,
	changes: IDatabaseChange[],
	localChangesFromRemote: IDatabaseChange[],
	{ c: convs, deleted, folder }: SyncResponse
): Promise<IDatabaseChange[]> {
	if (isInitialSync) {
		return extractAllConversationsForInitialSync(_fetch, folder!);
	}

	const ids = map<SyncResponseConversation>(convs || [], 'id');

	const dbChanges: IDatabaseChange[] = [];
	return db.conversations.where('id').anyOf(ids).toArray()
		.then((dbConvsArray) => keyBy(dbConvsArray, 'id'))
		.then((dbConvs: {[id: string]: MailConversationFromDb}) => {
			if (convs && convs[0] && convs[0].f) {
				return {
					dbConvs,
					dbChangesUpdated: reduce<{[id: string]: MailConversationFromDb}, IDatabaseChange[]>(
						dbConvs,
						(acc: IDatabaseChange[], value: MailConversationFromDb) => {
							const obj: {[keyPath: string]: any | undefined} = {};
							if (convs[0].f) {
								obj.read = !(/u/.test(convs[0].f));
								obj.attachment = /a/.test(convs[0].f);
								obj.flagged = /f/.test(convs[0].f);
								obj.urgent = /!/.test(convs[0].f);
							}
							acc.push({
								type: 2,
								table: 'messages',
								key: value._id,
								mods: obj
							});
							return acc;
						},
						dbChanges
					)
				};
			}
			return { dbConvs, dbChangesUpdated: [] };
		})
		.then(({ dbChangesUpdated, dbConvs }) => {
			const remoteIds = differenceWith(ids, keys(dbConvs), isEqual);
			if (remoteIds.length > 0) {
				return fetchMailConversationsById(
					_fetch,
					remoteIds
				)
					.then((SoapMailConvs) => reduce<MailConversationFromSoap, IDatabaseChange[]>(
						SoapMailConvs,
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
					.then((dbMailsArray) => keyBy(dbMailsArray, 'id'))
					.then(
						(deletedMails) => reduce<{ [key: string]: MailConversationFromDb }, IDatabaseChange[]>(
							deletedMails || {},
							(acc: IDatabaseChange[], value: MailConversationFromDb) => {
								acc.push({
									type: 3,
									table: 'conversations',
									key: value._id,
								});
								return acc;
							},
							dbChangesUpdatedAndFetched
						)
					);
			}
			return dbChangesUpdatedAndFetched;
		});
}
