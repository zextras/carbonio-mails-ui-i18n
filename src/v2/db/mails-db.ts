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
import { SoapFetch } from '@zextras/zapp-shell';
import { BehaviorSubject } from 'rxjs';
import { sortBy, last, reverse, map } from 'lodash';
import { MailsFolder, MailsFolderFromDb } from './mails-folder';
import { fetchConversationsInFolder } from '../soap';
import { CompositionState } from '../edit/use-composition-data';
import { Participant } from './mail-db-types';
import { MailsDbDexie } from './mails-db-dexie';
import { MailConversationFromDb, MailConversationFromSoap } from './mail-conversation';

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

	public getFolderChildren(folder: MailsFolder): Promise<MailsFolder[]> {
		// TODO: For locally created folders we should resolve the internal id, we should ALWAYS to that
		if (!folder.id) return Promise.resolve([]);
		return this.folders.where({ parent: folder.id }).sortBy('name');
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
				read: false,
				parts: [],
				size: 0,
				attachment: false,
				flagged: false,
				urgent: false,
				bodyPath: '',
				send: false,
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
			urgent: cState.urgent,
		}).then(() => draftId);
	}

	public sendMail(draftId: string): Promise<string> {
		return this.messages.update(draftId, { send: true }).then(() => draftId);
	}

	public checkHasMoreConv(f: MailsFolderFromDb, lastConv?: MailConversationFromDb): Promise<boolean> {
		if (!f.id) return Promise.resolve(false);
		return fetchConversationsInFolder(
			this._soapFetch,
			f,
			1,
			lastConv ? new Date(lastConv.date) : undefined
		).then(([convs, hasMore]) => (hasMore || (convs.length > 0)));
	}

	public fetchMoreConv(f: MailsFolderFromDb, lastConv?: MailConversationFromSoap): Promise<[Array<MailConversationFromSoap>, boolean]> {
		return fetchConversationsInFolder(
			this._soapFetch,
			f,
			50,
			lastConv ? new Date(lastConv.date) : undefined
		);
	}
}
