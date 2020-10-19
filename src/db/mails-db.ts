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
import { map, reduce, pullAllWith } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { SoapFetch, accounts } from '@zextras/zapp-shell';
import { MailConversationFromDb, MailConversationFromSoap } from './mail-conversation';
import { MailsFolder, MailsFolderFromDb } from './mails-folder';
import { fetchConversationsInFolder } from '../soap';
import { CompositionState } from '../edit/composition-types';
import { Participant } from './mail-db-types';
import { MailsDbDexie } from './mails-db-dexie';
import { MailMessageFromDb, MailMessageFromSoap } from './mail-message';
import { MailConversationMessage } from './mail-conversation-message';
import { report } from '../commons/report-exception';

export type DeletionData = {
	_id: string;
	id: string;
	table: 'mails' | 'folders';
	rowId?: string;
};

export class MailsDb extends MailsDbDexie {
	constructor(
		private _soapFetch: SoapFetch
	) {
		super();
	}

	public open(): PromiseExtended<MailsDb> {
		return super.open().then((db) => db as MailsDb).catch(report);
	}

	public getFolderChildren(folder: MailsFolder): Promise<MailsFolderFromDb[]> {
		// TODO: For locally created folders
		//  we should resolve the internal id, we should ALWAYS to that.
		if (!folder.id) return Promise.resolve([]);
		return this.folders.where({ parent: folder.id }).sortBy('name').catch(report);
	}

	public deleteFolder(f: MailsFolderFromDb): Promise<void> {
		return this.folders.get(f._id!).then((_f) => {
			if (_f) {
				return this.deletions
					.add({
						rowId: this.createUUID(),
						_id: _f._id!,
						id: _f.id!,
						table: 'folders'
					})
					.then(() => this.folders.delete(_f._id!).then(() => undefined))
					.catch(report);
			}
			return undefined;
		});
	}

	public saveDraft(draftId: string, cState: CompositionState): Promise<string> {
		if (draftId === 'new') {
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			return this.messages.add({
				parent: '6',
				conversation: '',
				contacts: [],
				date: Date.now(),
				subject: '',
				fragment: '',
				read: true,
				parts: [
					cState.richText
						? {
							contentType: 'multipart/alternative',
							parts: [
								{
									contentType: 'text/plain',
									content: cState.body.text
								},
								{
									contentType: 'text/html',
									content: cState.body.html
								}
							]
						}
						: {
							contentType: 'text/plain',
							content: cState.body.text
						}
				],
				size: 0,
				attachment: false,
				flagged: false,
				urgent: false,
				send: false
			}).catch(report);
		}
		return this.messages.update(draftId, {
			subject: cState.subject,
			contacts: [
				...map(cState.to, (c: { value: string }): Participant => ({
					type: 't',
					address: c.value,
					displayName: ''
				}) as Participant),
				...map(cState.cc, (c: { value: string }): Participant => ({
					type: 'c',
					address: c.value,
					displayName: ''
				}) as Participant),
				...map(cState.bcc, (c: { value: string }): Participant => ({
					type: 'b',
					address: c.value,
					displayName: ''
				}) as Participant),
				{
					type: 'f',
					address: accounts[0].name,
					displayName: accounts[0].displayName
				} as Participant
			],
			parts: [cState.richText
				? {
					contentType: 'multipart/alternative',
					parts: [
						{
							contentType: 'text/plain',
							content: cState.body.text
						},
						{
							contentType: 'text/html',
							content: cState.body.html
						}
					]
				}
				: {
					contentType: 'text/plain',
					content: cState.body.text
				}
			],
			date: Date.now(),
			attachment: false,
			flagged: cState.flagged,
			urgent: cState.urgent
		}).then(() => draftId).catch(report);
	}

	public saveDraftFromAction(cState: CompositionState, conversation: string): Promise<string> {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		return this.messages.add({
			parent: '6',
			conversation,
			contacts: [
				...map(cState.to, (c: { value: string }): Participant => ({
					type: 't',
					address: c.value,
					displayName: ''
				}) as Participant),
				...map(cState.cc, (c: { value: string }): Participant => ({
					type: 'c',
					address: c.value,
					displayName: ''
				}) as Participant),
				{
					type: 'f',
					address: accounts[0].name,
					displayName: accounts[0].displayName
				} as Participant
			],
			date: Date.now(),
			subject: cState.subject,
			fragment: cState.body.text.substring(0, 60),
			read: true,
			parts: [
				cState.richText
					? {
						contentType: 'multipart/alternative',
						parts: [
							{
								contentType: 'text/plain',
								content: cState.body.text,
							},
							{
								contentType: 'text/html',
								content: cState.body.html,
							}
						]
					}
					: {
						contentType: 'text/plain',
						content: cState.body.text,
					}
			],
			size: 0,
			attachment: false,
			flagged: false,
			urgent: false,
			send: false
		});
	}

	public sendMail(draftId: string): Promise<string> {
		return this.messages.update(draftId, { send: true }).then(() => draftId).catch(report);
	}

	public moveMessageToTrash(id: string): Promise<number> {
		return this.messages.update(id, { parent: '3' }).catch(report);
	}

	public deleteMessage(message: MailMessageFromDb): Promise<void> {
		return this.transaction('rw', this.conversations, this.messages, () => {
			this.conversations.where('id').equals(message.conversation)
				.modify((value, ref) => {
					const newConversation = {
						...value,
						messages: value.messages.filter((obj) => obj.id !== message.id),
						msgCount: value.msgCount - 1
					};
					// eslint-disable-next-line no-param-reassign
					ref.value = newConversation;
				}).then((n) => n)
				.catch(report);
			this.messages.delete(message._id)
				.catch(report);
		}).catch(report);
	}

	public checkHasMoreConv(
		f: MailsFolderFromDb,
		lastConv?: MailConversationFromDb
	): Promise<boolean> {
		if (!f.id) return Promise.resolve(false);
		return fetchConversationsInFolder(
			this._soapFetch,
			f,
			1,
			lastConv ? new Date(lastConv.date) : undefined,
			false
		).then(([convs, convsMessages, hasMore]) => (hasMore || (convs.length > 0)))
			.catch((err) => {
				report(err);
				return false;
			});
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
			.then(([remoteConvs, remoteConvsMessages, hasMore]) =>
				this.transaction('rw', this.conversations, this.messages, () =>
					this.checkForDuplicates(remoteConvs, remoteConvsMessages)
						.then(
							([convsToAdd, convsMessagesToAdd]) =>
								this.saveConvsAndMessages(
									convsToAdd as MailConversationFromDb[],
									convsMessagesToAdd as MailMessageFromDb[]
								)
						))
					.then(() => hasMore)
					.catch(() => false));
	}

	public checkForDuplicates(
		remoteConvs: MailConversationFromSoap[],
		remoteConvsMessages: MailMessageFromSoap[]
	): Promise<Array<MailConversationFromDb[] | MailMessageFromDb[]>> {
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
			this.getConvsMessagesToAdd(convsMessageIds, remoteConvsMessages)//TODO: catch these
		]);
	}

	public saveConvsAndMessages(
		convsToAdd: MailConversationFromDb[],
		convsMessagesToAdd: MailMessageFromDb[]
	): Promise<string[] | void[]> {
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
			))
			.catch(report);
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
			))
			.catch(report);
	}

	public setFlag(messageId: string, value: boolean): Promise<void> {
		return this.messages.update(messageId, {
			flagged: value
		}).then(() => {
		}).catch(report);
	}

	public setRead(messageId: string, value: boolean): Promise<void> {
		return this.messages.update(messageId, {
			read: value
		}).then(() => {
		}).catch(report);
	}
}
