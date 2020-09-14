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

import { PromiseExtended } from 'dexie';
import { reduce, pullAllWith } from 'lodash';
import { SoapFetch } from '@zextras/zapp-shell';
import { MailsFolder, MailsFolderFromDb } from './mails-folder';
import { MailConversationFromDb, MailConversationFromSoap } from './mail-conversation';
import { fetchConversationsInFolder } from '../soap';
import { MailsDbDexie } from './mails-db-dexie';
import { MailMessageFromDb, MailMessageFromSoap } from './mail-message';
import { MailConversationMessage } from './mail-conversation-message';

export type DeletionData = {
	_id: string;
	id: string;
	table: 'mails'|'folders';
	rowId?: string;
};

export class MailsDb extends MailsDbDexie {
	constructor(
		private _soapFetch: SoapFetch
	) {
		super();
	}

	public open(): PromiseExtended<MailsDb> {
		return super.open().then((db) => db as MailsDb);
	}

	public getFolderChildren(folder: MailsFolder): Promise<MailsFolderFromDb[]> {
		// TODO: For locally created folders we should resolve the internal id, we should ALWAYS to that
		if (!folder.id) return Promise.resolve([]);
		return this.folders.where({ parent: folder.id }).sortBy('name');
	}

	public deleteFolder(f: MailsFolderFromDb): Promise<void> {
		return this.folders.get(f._id!).then((_f) => {
			if (_f) {
				console.log({ _id: _f._id!, id: _f.id!, table: 'folders' });
				return this.deletions
					.add({
						rowId: this.createUUID(),
						_id: _f._id!,
						id: _f.id!,
						table: 'folders'
					})
					.then(() => this.folders.delete(_f._id!).then(() => undefined))
					.catch(console.error);
			}
			return undefined;
		});
	}

	public checkHasMoreConv(f: MailsFolderFromDb, lastConv?: MailConversationFromDb): Promise<boolean> {
		if (!f.id) return Promise.resolve(false);
		return fetchConversationsInFolder(
			this._soapFetch,
			f,
			1,
			lastConv ? new Date(lastConv.date) : undefined,
			false
		).then(([convs, convsMessages, hasMore]) => (hasMore || (convs.length > 0)));
	}

	public fetchMoreConv(f: MailsFolderFromDb, lastConv?: MailConversationFromDb): Promise<boolean> {
		if (!f.id) {
			return Promise.resolve(false);
		}
		return fetchConversationsInFolder(
			this._soapFetch,
			f,
			50,
			lastConv ? new Date(lastConv.date) : undefined
		)
			.then(([remoteConvs, remoteConvsMessages, hasMore]) => {
				return this.transaction('rw', this.conversations, this.messages, () => {
					return this.checkForDuplicates(remoteConvs, remoteConvsMessages)
						.then(
							([convsToAdd, convsMessagesToAdd]) =>
								this.saveConvsAndMessages(
									convsToAdd as MailConversationFromDb[],
									convsMessagesToAdd as MailMessageFromDb[]
								)
						);
				})
					.then(() => hasMore)
					.catch(() => false);
			});
	}

	public checkForDuplicates(
		remoteConvs: MailConversationFromSoap[],
		remoteConvsMessages: MailMessageFromSoap[]
	): Promise<Array<MailConversationFromDb[]|MailMessageFromDb[]>> {
		const [convsIds, convsMessageIds] = reduce<MailConversationFromSoap, Array<string[]>>(
			remoteConvs,
			([r1, r2], v) => [
				[...r1, v.id],
				[
					...r2,
					...reduce(
						v.messages,
						(acc: string[], m: MailConversationMessage): string[] => [...acc, m.id!],
						[]
					)
				]
			],
			[[], []]
		);
		return Promise.all([
			this.getConvsToAdd(convsIds, remoteConvs),
			this.getConvsMessagesToAdd(convsMessageIds, remoteConvsMessages)
		]);
	}

	public saveConvsAndMessages(
		convsToAdd: MailConversationFromDb[],
		convsMessagesToAdd: MailMessageFromDb[]
	): Promise<string[]|void[]> {
		return Promise.all([
			this.messages.bulkAdd(convsMessagesToAdd),
			this.conversations.bulkAdd(convsToAdd)
		]);
	}

	private getConvsToAdd(
		convsIds: string[],
		remoteConvs: MailConversationFromSoap[]
	): Promise<MailConversationFromDb[]> {
		return this.conversations
			.where('id')
			.anyOf(convsIds)
			.toArray()
			.then<MailConversationFromSoap[]>(
				(localConvs) => {
					pullAllWith(
						remoteConvs,
						localConvs,
						(a, b) => ((b.id) ? a.id === b.id : false)
					);
					return remoteConvs;
				}
			)
			.then((convs) => reduce<MailConversationFromSoap, MailConversationFromDb[]>(
				convs,
				(r, v) => {
					r.push(
						new MailConversationFromDb({
							...v,
							_id: this.createUUID()
						})
					);
					return r;
				},
				[]
			));
	}

	private getConvsMessagesToAdd(
		convsMessagesIds: string[],
		remoteConvsMessages: MailMessageFromSoap[]
	): Promise<MailMessageFromDb[]> {
		return this.messages
			.where('id')
			.anyOf(convsMessagesIds)
			.toArray()
			.then<MailMessageFromSoap[]>(
				(localMessages) => {
					pullAllWith(
						remoteConvsMessages,
						localMessages,
						(a, b) => ((b.id) ? a.id === b.id : false)
					);
					return remoteConvsMessages;
				}
			)
			.then((msgs) => reduce<MailMessageFromSoap, MailMessageFromDb[]>(
				msgs,
				(r, v) => {
					r.push(
						new MailMessageFromDb({
							...v,
							_id: this.createUUID()
						})
					);
					return r;
				},
				[]
			));
	}
}
