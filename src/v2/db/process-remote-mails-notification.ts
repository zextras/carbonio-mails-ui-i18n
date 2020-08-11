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

import { MailsDb } from './mails-db';
import { IDatabaseChange } from 'dexie-observable/api';
import { SyncResponse } from '../soap';

export default function processRemoteMailsNotification(
	_fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
	db: MailsDb,
	isInitialSync: boolean,
	changes: IDatabaseChange[],
	localChangesFromRemote: IDatabaseChange[],
	{ m, deleted, folder }: SyncResponse
): Promise<IDatabaseChange[]> {
	return Promise.resolve([]);
}
