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

import { IPersistedContext, ISyncProtocol, PollContinuation, ReactiveContinuation } from 'dexie-syncable/api';
import { MailsDb } from './mails-db';
import { IDatabaseChange } from 'dexie-observable/api';
import processLocalFolderChange from './process-local-folder-change';
import { SyncResponse } from '../soap';
import processRemoteFolderNotifications from './process-remote-folder-notifications';
import processRemoteMailsNotification from './process-remote-mails-notification';
import processLocalMailsChange from './process-local-mails-change';

const POLL_INTERVAL = 20000;

interface IContactsDexieContext extends IPersistedContext {
	clientIdentity?: '';
}

export class MailsDbSoapSyncProtocol implements ISyncProtocol {
	constructor(
		private _db: MailsDb,
		private _fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
	) {}

	public sync(
		context: IContactsDexieContext,
		url: string,
		options: any,
		baseRevision: any,
		syncedRevision: any,
		changes: IDatabaseChange[],
		partial: boolean,
		applyRemoteChanges: (changes: IDatabaseChange[], lastRevision: any, partial?: boolean, clear?: boolean) => Promise<void>,
		onChangesAccepted: () => void,
		onSuccess: (continuation: (PollContinuation | ReactiveContinuation)) => void,
		onError: (error: any, again?: number) => void
	): void {
		processLocalFolderChange(
			this._db,
			changes,
			this._fetch
		)
			.then((localChangesFromRemote) => {
				this._fetch(
					'/service/soap/SyncRequest',
					{
						method: 'POST',
						body: JSON.stringify({
							Body: {
								SyncRequest: {
									_jsns: 'urn:zimbraMail',
									typed: true,
									token: syncedRevision
								}
							}
						})
					}
				)
					.then((response) => response.json())
					.then((r) => {
						// TODO: Handle "mail.MUST_RESYNC" fault
						if (r.Body.Fault) throw new Error(r.Body.Fault.Reason.Text);
						else return r.Body.SyncResponse as SyncResponse;
					})
					.then(
						({
							token,
							folder,
							md,
							cn,
							deleted,
						}) => new Promise<SyncResponse & { remoteChanges: IDatabaseChange[] }>(
							(resolve, reject) => {
								processRemoteFolderNotifications(
									this._db,
									!baseRevision,
									changes,
									localChangesFromRemote,
									{
										token,
										md,
										folder,
										deleted
									}
								)
									.then((remoteChanges) => resolve({
										token,
										md,
										cn,
										folder,
										deleted,
										remoteChanges
									}))
									.catch((e: Error) => reject(e));
							}
						)
					)
					.then(({
						token,
						cn,
						md,
						folder,
						deleted,
						remoteChanges
					}) =>
						processLocalMailsChange(
							this._db,
							changes,
							this._fetch
						)
							.then((_localChangesFromRemote) => {
								localChangesFromRemote.push(..._localChangesFromRemote);
							})
							.then(() => processRemoteMailsNotification(
								this._fetch,
								this._db,
								!baseRevision,
								changes,
								localChangesFromRemote,
								{
									token,
									md,
									cn,
									folder,
									deleted
								}
							))
							.then((_remoteChanges) => remoteChanges.push(..._remoteChanges))
							.then(() => ({ token, remoteChanges })))
					.then(({ token, remoteChanges }) => {
						if (context.clientIdentity !== '') {
							context.clientIdentity = '';
							return context.save()
								.then(() => ({
									token,
									remoteChanges
								}));
						}

						return {
							token,
							remoteChanges
						};
					})
					.then(
						({ token, remoteChanges }) =>
							applyRemoteChanges([...localChangesFromRemote, ...remoteChanges], token, false)
					)
					.then(() => {
						onChangesAccepted();
						onSuccess({ again: POLL_INTERVAL });
					})
					.catch((e) => {
						onError(e, POLL_INTERVAL);
					});
			})
			.catch((e) => {
				onError(e, POLL_INTERVAL);
			});
	}
}
