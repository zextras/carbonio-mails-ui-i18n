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

import { reduce, map, omit } from 'lodash';
import { ICreateChange, IDatabaseChange } from 'dexie-observable/api';
import { MailsDb } from './mails-db';
import {
	GetMsgRequest,
	GetMsgResponse, SoapEmailMessageObj,
	SyncResponse, SyncResponseMail,
	SyncResponseMailFolder
} from '../soap';
import { MailMessage } from './mail-message';
import { normalizeMailMessageFromSoap } from './mails-db-utils';

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

export function fetchMessages(
	_fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
	ids: string[]
): Promise<MailMessage[]> {
	if (ids.length < 1) return Promise.resolve([]);
	const getMsgRequest: GetMsgRequest = {
		_jsns: 'urn:zimbraMail',
		m: reduce<string, Array<{id: string}>>(
			ids,
			(r, v) => {
				r.push({ id: v });
				return r;
			},
			[]
		)
	};

	return _fetch(
		'/service/soap/GetMsgRequest',
		{
			method: 'POST',
			body: JSON.stringify({
				Body: {
					GetMsgRequest: getMsgRequest
				}
			})
		}
	)
		.then((response) => response.json())
		.then((r) => {
			if (r.Body.Fault) throw new Error(r.Body.Fault.Reason.Text);
			else return r.Body.GetMsgResponse;
		})
		.then((response: GetMsgResponse) => {
			return reduce<SoapEmailMessageObj, MailMessage[]>(
				response.m,
				(r, m) => {
					r.push(
						normalizeMailMessageFromSoap(m)
					);
					return r;
				},
				[]
			);
		});
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
	return fetchMessages(
		_fetch,
		mIds
	)
		.then((message) => reduce<MailMessage, ICreateChange[]>(
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

function searchLocalMails(db: MailsDb, ids: string[]): Promise<{[key: string]: string}> {
	return db.messages.where('id').anyOf(ids).toArray()
		.then((localMails) => reduce<MailMessage, {[key: string]: string}>(
			localMails,
			(r, f) => {
				// @ts-ignore
				r[f.id] = f._id;
				return r;
			},
			{}
		));
}

export default function processRemoteMailsNotification(
	_fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
	db: MailsDb,
	isInitialSync: boolean,
	changes: IDatabaseChange[],
	localChangesFromRemote: IDatabaseChange[],
	{ m, deleted, folder }: SyncResponse
): Promise<IDatabaseChange[]> {
	if (isInitialSync) {
		// Extract all contacts form all the folders
		return extractAllMailsForInitialSync(_fetch, folder!);
	}

	const ids = map<SyncResponseMail>(m || [], 'id');

	return fetchMessages(
		_fetch,
		ids
	)
		.then((message) => searchLocalMails(
			db,
			ids
		)
			.then((idToLocalUUIDMap) => {
				const isLocallyCreated: {[key: string]: string} = {};
				return { idToLocalUUIDMap, isLocallyCreated };
			})
			.then(({ idToLocalUUIDMap, isLocallyCreated }) => {
				const dbChanges = reduce<MailMessage, IDatabaseChange[]>(
					message,
					(r, c) => {
						// @ts-ignore
						if (idToLocalUUIDMap.hasOwnProperty(c.id)) {
							// @ts-ignore
							c._id = idToLocalUUIDMap[c.id];
							r.push({
								type: 2,
								table: 'messages',
								key: c._id,
								mods: omit(c, ['_id', 'id'])
							});
						}
						else if (!isLocallyCreated[c.id!]) {
							r.push({
								type: 1,
								table: 'messages',
								key: undefined,
								obj: c
							});
						}
						return r;
					},
					[]
				);

				if (deleted && deleted[0] && deleted[0].m) {
					return searchLocalMails(
						db,
						deleted[0].m[0].ids.split(','),
					)
						.then((deletedIdToLocalUUIDMap) => {
							reduce<{[key: string]: string}, IDatabaseChange[]>(
								deletedIdToLocalUUIDMap,
								(r, _id, id) => {
									r.push({
										type: 3,
										table: 'messages',
										key: _id,
									});
									return r;
								},
								dbChanges
							);
							return dbChanges;
						});
				}
				return dbChanges;
			}));
}
