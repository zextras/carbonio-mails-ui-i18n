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
import { sortBy, last, reverse } from 'lodash';
import { MailsFolder } from './mails-folder';
import { MailMessage } from './mail-message';
import { MailConversation } from './mail-conversation';
import { fetchConversationsInFolder } from '../soap';
import { map } from 'lodash';

export type DeletionData = {
	_id: string;
	id: string;
	table: 'mails'|'folders';
	rowId?: string;
};

export type GetConvSubjectData = {
	conversations: Array<MailConversation>;
	loading: boolean;
	hasMore: boolean;
};

export class MailsDb extends db.Database {
	private _fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;

	folders: Dexie.Table<MailsFolder, string>; // string = type of the primary key

	messages: Dexie.Table<MailMessage, string>; // string = type of the primary key

	conversations: Dexie.Table<MailConversation, string>; // string = type of the primary key

	deletions: Dexie.Table<DeletionData, string>;

	constructor(
		fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
	) {
		super('mails');
		this.version(1).stores({
			folders: '$$_id, id, parent',
			messages: '$$_id, id, parent, conversation',
			conversations: '$$_id, id, *parent',
			deletions: '$$rowId, _id, id'
		});
		this.folders = this.table('folders');
		this.folders.mapToClass(MailsFolder);
		this.messages = this.table('messages');
		this.messages.mapToClass(MailMessage);
		this.conversations = this.table('conversations');
		this.conversations.mapToClass(MailConversation);
		this.deletions = this.table('deletions');
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
						subject.complete();
					});
				// TODO: Catch possible errors to complete the subject
			});
		return subject;
	}
}
