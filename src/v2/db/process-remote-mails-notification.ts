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
	reduce,
	map,
	differenceWith,
	isEqual,
	keyBy
} from 'lodash';

import { ICreateChange, IDatabaseChange } from 'dexie-observable/api';
import { MailsDb } from './mails-db';
import {
	fetchMailMessagesById,
	SyncResponse,
	SyncResponseMail,
	SyncResponseMailFolder
} from '../soap';
import { MailMessageFromDb, MailMessageFromSoap } from './mail-message';

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

function extractAllMailsForInitialSync(
	_fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
	folders: Array<SyncResponseMailFolder>
): Promise<ICreateChange[]> {
	const mIds = reduce<SyncResponseMailFolder, string[]>(
		folders,
		_folderReducer,
		[]
	);
	return fetchMailMessagesById(
		_fetch,
		mIds
	)
		.then((message) => reduce<MailMessageFromSoap, ICreateChange[]>(
			message,
			(r, m) => {
				r.push({
					type: 1,
					table: 'messages',
					key: undefined,
					obj: m
				});
				return r;
			},
			[]
		));
}

export default function processRemoteMailsNotification(
	_fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
	db: MailsDb,
	isInitialSync: boolean,
	changes: IDatabaseChange[],
	localChangesFromRemote: IDatabaseChange[],
	{ m: mails, deleted, folder }: SyncResponse
): Promise<IDatabaseChange[]> {
	if (isInitialSync) {
		// Extract all mails from all the folders
		return extractAllMailsForInitialSync(_fetch, folder!);
	}

	const ids = map<SyncResponseMail>(mails || [], 'id');

	const dbChanges: IDatabaseChange[] = [];
	return db.messages.where('id').anyOf(ids).toArray()
		.then((dbMailsArray) => keyBy(dbMailsArray, 'id'))
		.then((dbMails: {[id: string]: MailMessageFromDb}) => {
			if (mails && mails[0] && (mails[0].f || mails[0].l)) {
				return {
					dbMails,
					dbChangesUpdated: reduce<{[id: string]: MailMessageFromDb}, IDatabaseChange[]>(
						dbMails,
						(acc: IDatabaseChange[], value: MailMessageFromDb) => {
							const obj: {[keyPath: string]: any | undefined} = {};
							if (mails[0].l) {
								obj.parent = mails[0].l;
							}
							if (mails[0].f) {
								obj.read = !(/u/.test(mails[0].f));
								obj.attachment = /a/.test(mails[0].f);
								obj.flagged = /f/.test(mails[0].f);
								obj.urgent = /!/.test(mails[0].f);
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
			return { dbMails, dbChangesUpdated: [] };
		})
		.then(({ dbChangesUpdated, dbMails }) => {
			const remoteIds = differenceWith(ids, keys(dbMails), isEqual);
			if (remoteIds.length > 0) {
				return fetchMailMessagesById(
					_fetch,
					remoteIds
				)
					.then((soapMails) => reduce<MailMessageFromSoap, IDatabaseChange[]>(
						soapMails,
						(acc, value) => {
							acc.push({
								type: 1,
								table: 'messages',
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
			if (deleted && deleted[0] && deleted[0].m) {
				return db.messages.where('id').anyOf(deleted[0].m[0].ids.split(',')).toArray()
					.then((dbMailsArray) => keyBy(dbMailsArray, 'id'))
					.then((deletedMails) => reduce<{ [key: string]: MailMessageFromDb }, IDatabaseChange[]>(
						deletedMails || {},
						(acc: IDatabaseChange[], value: MailMessageFromDb) => {
							acc.push({
								type: 3,
								table: 'messages',
								key: value._id,
							});
							return acc;
						},
						dbChangesUpdatedAndFetched
					));
			}
			return dbChangesUpdatedAndFetched;
		});
};
