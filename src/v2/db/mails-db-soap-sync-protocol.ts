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
import { SoapFetch } from '@zextras/zapp-shell';
import { MailsDb } from './mails-db';
import processLocalFolderChange from './process-local-folder-change';
import { fetchConversationsInFolder, fetchMailMessagesById, SyncRequest, SyncResponse } from '../soap';
import processRemoteFolderNotifications from './process-remote-folder-notifications';
import processRemoteMailsNotification from './process-remote-mails-notification';
import processLocalMailsChange from './process-local-mails-change';
import { MailConversationMessage } from './mail-conversation-message';
import { MailsFolderFromDb, MailsFolderFromSoap } from './mails-folder';
import { MailMessageFromSoap } from './mail-message';
import { MailConversationFromSoap } from './mail-conversation';

const POLL_INTERVAL = 20000;

interface IContactsDexieContext extends IPersistedContext {
	clientIdentity?: '';
}

export class MailsDbSoapSyncProtocol implements ISyncProtocol {
	constructor(
		private _db: MailsDb,
		private _soapFetch: SoapFetch
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
			this._soapFetch
		)
			.then((localChangesFromRemote) => {
				this._soapFetch<SyncRequest, SyncResponse>(
					'Sync',
					{
						_jsns: 'urn:zimbraMail',
						typed: 1,
						token: syncedRevision
					}
				)
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
							this._soapFetch
						)
							.then((_localChangesFromRemote) => {
								localChangesFromRemote.push(..._localChangesFromRemote);
							})
							.then(() => processRemoteMailsNotification(
								this._soapFetch,
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
							.then((_remoteChanges) => {
								remoteChanges.push(..._remoteChanges);
								return ({ token, remoteChanges });
							}))
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
			this._soapFetch,
			(folder as ICreateChange).obj as unknown as MailsFolderFromDb,
			undefined,
			new Date(0)
		)
			.then(
				([convs, hasMore]) => fetchMailMessagesById(
					this._soapFetch,
					reduce<MailConversationFromSoap, string[]>(
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
				).then((msgs: MailMessageFromSoap[]): [MailConversationFromSoap[], IDatabaseChange[]] => ([
					convs,
					reduce(
						msgs,
						(acc, v) => {
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
				]))
			)
			.then(([convs, _remoteChanges]) => reduce(
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
				_remoteChanges
			));
	}
}
