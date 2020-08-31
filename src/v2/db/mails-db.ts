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

import Dexie, { PromiseExtended } from 'dexie';
import { db } from '@zextras/zapp-shell';
import { BehaviorSubject } from 'rxjs';
import { sortBy, last, reverse, map } from 'lodash';
import { MailsFolder } from './mails-folder';
import { MailConversation } from './mail-conversation';
import { fetchConversationsInFolder } from '../soap';
import { CompositionState } from '../edit/use-composition-data';
import { Participant } from './mail-db-types';
import { MailsDbDexie } from './mails-db-dexie';

export type DeletionData = {
	_id: string;
	id: string;
	table: 'mails'|'folders';
	rowId?: string;
};

export class MailsDb extends MailsDbDexie {
	private _fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;

	constructor(
		fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
	) {
		super();
		this._fetch = fetch;
	}

	public open(): PromiseExtended<MailsDb> {
		return super.open().then((db) => db as MailsDb);
	}

	public getFolderChildren(folder: MailsFolder): Promise<MailsFolder[]> {
		// TODO: For locally created folders we should resolve the internal id, we should ALWAYS to that.
		if (!folder.id) return Promise.resolve([]);
		return this.folders.where({ parent: folder.id }).sortBy('name');
	}

	public deleteFolder(f: MailsFolder): Promise<void> {
		return this.folders.get(f._id!).then((_f) => {
			if (_f) {
				console.log({ _id: _f._id!, id: _f.id!, table: 'folders' });
				return this.deletions.add({ rowId: this.createUUID(), _id: _f._id!, id: _f.id!, table: 'folders' })
					.then(() => this.folders.delete(_f._id!).then(() => undefined))
					.catch(console.error);
			}
			return undefined;
		});
	}

	public getConvInFolder(f: MailsFolder): BehaviorSubject<GetConvSubjectData> {
		const subject = new BehaviorSubject<GetConvSubjectData>({ conversations: [], loading: true, hasMore: false });
		this.conversations.where('parent').equals(f.id!).toArray()
			.then((conversations: MailConversation[]) => {
				const sorted = reverse(sortBy(conversations, 'date'));
				const _last = last(conversations);
				subject.next({
					...subject.getValue(),
					conversations: sorted
				});

				fetchConversationsInFolder(
					this._fetch,
					f,
					1,
					_last ? new Date(_last.date) : undefined
				)
					.then(([convs, hasMore]) => {
						subject.next({
							...subject.getValue(),
							hasMore: convs.length > 0 || hasMore,
							loading: false
						});
					});
				// TODO: Catch possible errors to complete the subject
			});
		return subject;
	}

	public saveDraft(draftId: string, cState: CompositionState): Promise<string> {
		console.log(cState);
		if (draftId === 'new') {
			return this.messages.add({
				parent: '6',
				conversation: '',
				contacts: [],
				date: Date.now(),
				subject: '',
				fragment: '',
				read: false,
				parts: [],
				size: 0,
				attachment: false,
				flagged: false,
				urgent: false,
				bodyPath: ''
			});
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
				}) as Participant)
			],
			parts: [
				{
					contentType: 'text/plain',
					size: cState.body.text.length,
					content: cState.body.text,
					name: '1',
				},
				{
					contentType: 'text/html',
					size: cState.body.html.length,
					content: cState.body.html,
					name: '1',
				}
			],
			date: Date.now(),
			attachment: false,
			flagged: cState.flagged,
			urgent: cState.urgent
		}).then(() => {
			console.log('saved: ', draftId);
			return draftId;
		});
	}

	public checkHasMoreConv(f: MailsFolder, lastConv?: MailConversation): Promise<boolean> {
		if (!f.id) return Promise.resolve(false);
		return fetchConversationsInFolder(
			this._fetch,
			f,
			1,
			lastConv ? new Date(lastConv.date) : undefined
		).then(([convs, hasMore]) => (hasMore || (convs.length > 0)));
	}

	public fetchMoreConv(f: MailsFolder, lastConv?: MailConversation): Promise<[Array<MailConversation>, boolean]> {
		return fetchConversationsInFolder(
			this._fetch,
			f,
			50,
			lastConv ? new Date(lastConv.date) : undefined
		);
	}
}
