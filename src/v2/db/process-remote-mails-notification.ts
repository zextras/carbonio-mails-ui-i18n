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
	differenceWith,
	isEqual,
	keyBy,
	uniq,
	omit
} from 'lodash';
import { SoapFetch } from '@zextras/zapp-shell';
import { ICreateChange, IDatabaseChange } from 'dexie-observable/api';
import { MailsDb } from './mails-db';
import {
	fetchMailMessagesById,
	fetchMailConversationsById,
	SyncResponse,
	SyncResponseMail,
	SyncResponseMailFolder
} from '../soap';
import { MailMessageFromDb, MailMessageFromSoap } from './mail-message';
import { MailConversationFromDb, MailConversationFromSoap } from './mail-conversation';

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
	_fetch: SoapFetch,
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
	_fetch: SoapFetch,
	db: MailsDb,
	isInitialSync: boolean,
	changes: IDatabaseChange[],
	localChangesFromRemote: IDatabaseChange[],
	{ m: mails, deleted }: SyncResponse
): Promise<IDatabaseChange[]> {
	if (isInitialSync) {
		return Promise.resolve([]);
	}
	const mappedMails = keyBy(mails || [], 'id');
	const ids = keys(mappedMails || []);
	const conversationsIds: string[] = reduce<
		{[id: string]: SyncResponseMail},
		string[]
	>(mappedMails, (acc, value) => ([...acc, value.cid]), []);
	const dbChanges: IDatabaseChange[] = [];
	return db.transaction('r', db.messages, db.conversations, () => Promise.all([
		db.messages.where('id').anyOf(ids).toArray(),
		db.conversations.where('id').anyOf(uniq(conversationsIds)).toArray()
	]))
		.then(([dbMailsArray, dbConversationsArray]: [MailMessageFromDb[], MailConversationFromDb[]]) => {
			const mappedConversations = keyBy(dbConversationsArray, 'id');
			return Promise.resolve(keyBy(dbMailsArray, 'id'))
				.then((dbMails: {[id: string]: MailMessageFromDb}) => ({
					dbMails,
					dbChangesUpdated: reduce<{[id: string]: MailMessageFromDb}, IDatabaseChange[]>(
						dbMails,
						(acc: IDatabaseChange[], value: MailMessageFromDb) => {
							if (value.id && mappedMails && mappedMails[value.id] && (mappedMails[value.id].f || mappedMails[value.id].l !== '6')) {
								const obj: {[keyPath: string]: any | undefined} = {};
								if (mappedMails[value.id].l) {
									obj.parent = mappedMails[value.id].l;
								}
								if (mappedMails[value.id].f) {
									obj.read = !(/u/.test(mappedMails[value.id].f || ''));
									obj.attachment = /a/.test(mappedMails[value.id].f || '');
									obj.flagged = /f/.test(mappedMails[value.id].f || '');
									obj.urgent = /!/.test(mappedMails[value.id].f || '');
								}
								acc.push({
									type: 2,
									table: 'messages',
									key: value._id,
									mods: obj
								});
							}
							return acc;
						},
						dbChanges
					)
				}))
				.then(({ dbChangesUpdated, dbMails }) => fetchMailMessagesById(
					_fetch,
					reduce(
						mails,
						(acc: string[], value: SyncResponseMail) => {
							if (value.l === '6' && dbMails[value.id]) {
								acc.push(value.id);
							}
							return acc;
						},
						[]
					)
				)
					.then((soapMails: MailMessageFromSoap[]) => ({
						dbChangesUpdated: reduce(
							soapMails,
							(acc: IDatabaseChange[], value: MailMessageFromSoap) => [
								...acc,
								{
									type: 2,
									table: 'messages',
									key: dbMails[value.id]._id,
									mods: value
								}
							],
							dbChangesUpdated
						),
						dbMails
					})))
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
				.then((dbChangesUpdated: IDatabaseChange[]) => fetchMailConversationsById(_fetch, uniq(conversationsIds))
					.then((fetchedConvs: MailConversationFromSoap[]) => reduce<MailConversationFromSoap, IDatabaseChange[]>(
						fetchedConvs,
						(acc, value) => {
							acc.push({
								type: 2,
								table: 'conversations',
								key: mappedConversations[value.id]._id,
								mods: omit(value, '_id')
							});
							return acc;
						},
						dbChangesUpdated
					)))
				.then((dbChangesUpdatedAndFetched: IDatabaseChange[]) => {
					if (deleted && deleted[0] && deleted[0].m) {
						return db.messages.where('id').anyOf(deleted[0].m[0].ids.split(',')).toArray()
							.then((dbMailsArr) => keyBy(dbMailsArr, 'id'))
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
		});
};
