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
import { ICreateChange, IDatabaseChange } from 'dexie-observable/api';
import { find, reduce } from 'lodash';
import { MailsDb } from './mails-db';
import processLocalFolderChange from './process-local-folder-change';
import { fetchConversationsInFolder, fetchMailMessagesById, SyncResponse } from '../soap';
import processRemoteFolderNotifications from './process-remote-folder-notifications';
import processRemoteMailsNotification from './process-remote-mails-notification';
import processLocalMailsChange from './process-local-mails-change';
import { MailConversationMessage } from './mail-conversation-message';
import { MailConversation } from './mail-conversation';
import { MailsFolderFromSoap } from './mails-folder';
import { MailMessageFromSoap } from './mail-message';

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
						headers: {
							'Content-Type': 'application/json'
						},
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
							m,
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
									.then((remoteChanges) => {
										if (!baseRevision) return this._fetchFirstSyncData(remoteChanges);
										return remoteChanges;
									})
									.then((remoteChanges) => resolve({
										token,
										md,
										m,
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
						m,
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
									m,
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

	private _fetchFirstSyncData(remoteChanges: Array<IDatabaseChange>): Promise<Array<IDatabaseChange>> {
		const folder = find(
			remoteChanges,
			{ obj: { id: '2' } } // Fetch the inbox folder
		);
		if (!folder) {
			return Promise.resolve(remoteChanges);
		}
		return fetchConversationsInFolder(
			this._fetch,
			(folder as ICreateChange).obj as unknown as MailsFolderFromSoap,
			undefined,
			new Date(0)
		)
			.then(
				([convs]) => fetchMailMessagesById(
					this._fetch,
					reduce<MailConversation, string[]>(
						convs,
						(acc, v) => {
							reduce<MailConversationMessage, string[]>(
								v.messages,
								(acc2, v2) => {
									acc2.push(v2.id!);
									return acc2;
								},
								acc
							);
							return acc;
						},
						[]
					)
				).then((msgs: {[k: string]: MailMessageFromSoap}) => [
					convs,
					reduce(
						msgs,
						(acc, v, k) => {
							acc.push({
								type: 1,
								table: 'messages',
								key: undefined,
								obj: v
							});
							return acc;
						},
						remoteChanges
					)
				])
			)
			.then(([convs, mesgs]) => reduce(
				convs,
				(acc, v) => {
					acc.push({
						type: 1,
						table: 'conversations',
						key: undefined,
						obj: v
					});
					return acc;
				},
				remoteChanges
			));
	}
}
