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

import idbSrvc from '@zextras/zapp-shell/idb';
import { fcSink } from '@zextras/zapp-shell/fc';

import { map, reduce } from 'lodash';
import { IMailsIdbService } from './IMailsIdbService';
import {
	Conversation,
	IMailFolderSchmV1,
	IMailsIdb,
	MailMessage
} from './IMailsIdb';
import { schemaVersion, upgradeFn } from './MailsIdb';

export default class MailsIdbService implements IMailsIdbService {

	constructor() {
		idbSrvc.setUpgradeFcn(
			schemaVersion,
			upgradeFn
		);
	}

	public getFolder(id: string): Promise<IMailFolderSchmV1|undefined> {
		return idbSrvc.openDb<IMailsIdb>()
			.then((idb) => idb.get<'folders'>('folders', id));
	}

	public getAllFolders(): Promise<{[id: string]: IMailFolderSchmV1}> {
		return idbSrvc.openDb<IMailsIdb>()
			.then(
				(idb) => idb.getAll<'folders'>('folders')
					.then((folders) => reduce<IMailFolderSchmV1, {[id: string]: IMailFolderSchmV1}>(
						folders,
						(r, v, k) => {
							// eslint-disable-next-line no-param-reassign
							r[v.id] = v;
							return r;
						},
						{}
					))
			);
	}

	public saveFolderData(f: IMailFolderSchmV1): Promise<IMailFolderSchmV1> {
		return idbSrvc.openDb<IMailsIdb>()
			.then((idb) => idb.put<'folders'>('folders', f));
	}

	public deleteFolders(ids: string[]): Promise<string[]> {
		if (ids.length < 1) return Promise.resolve([]);
		const cCopy = [...ids];
		const id = cCopy.shift();
		return idbSrvc.openDb<IMailsIdb>()
			.then((idb) => idb.delete<'folders'>('folders', id!))
			.then((_) => new Promise((resolve, reject) => {
				// TODO: Remove the children
				if (cCopy.length === 0) resolve([id!]);
				else {
					this.deleteFolders(cCopy)
						.then((r) => resolve([id!].concat(r)))
						.catch((e) => reject(e));
				}
			}));
	}

	public moveFolder(id: string, parent: string): Promise<void> {
		return idbSrvc.openDb<IMailsIdb>()
			.then((idb) => new Promise((resolve1, reject1) => {
				idb.get<'folders'>('folders', id)
					.then((f) => {
						if (!f) resolve1();
						idb.put<'folders'>('folders', { ...f!, parent })
							// TODO: Update the path and the children paths
							.then(
								() => idb.getAllFromIndex<'folders', 'parent'>(
									'folders',
									'parent',
									id
								)
									.then((folders) => Promise.all(
										map(
											folders,
											(f1) => idb.put<'folders'>(
												'folders',
												{ ...f1 }
											)
										)
									))
									.then(() => resolve1())
							)
							.catch((e) => reject1(e));
					});
			}));
	}

	public renameFolder(id: string, name: string): Promise<void> {
		return idbSrvc.openDb<IMailsIdb>()
			.then((idb) => new Promise((resolve1, reject1) => {
				idb.get<'folders'>('folders', id)
					.then((f) => {
						if (!f) resolve1();
						idb.put<'folders'>('folders', { ...f!, name })
							// TODO: Update the path and the children paths
							.then(() => resolve1())
							.catch((e) => reject1(e));
					});
			}));
	}

	public saveConversation(conv: Conversation): Promise<Conversation> {
		return idbSrvc.openDb<IMailsIdb>()
			.then((idb) => idb.put<'conversations'>('conversations', conv))
			.then((_) => conv);
	}

	public saveConversations(convs: Conversation[]): Promise<Conversation[]> {
		if (convs.length < 1) return Promise.resolve([]);
		const cCopy = [...convs];
		const conv = cCopy.shift();
		return this.saveConversation(conv!)
			.then((c1) => new Promise((resolve, reject) => {
				if (cCopy.length === 0) resolve([c1]);
				else {
					this.saveConversations(cCopy)
						.then((r) => resolve([c1].concat(r)))
						.catch((e) => reject(e));
				}
			}));
	}

	public fetchConversationsFromFolder(id: string): Promise<Conversation[]> {
		return idbSrvc.openDb<IMailsIdb>()
			.then((idb) => idb.getAllFromIndex<'conversations', 'parent'>('conversations', 'parent', id));
	}

	public saveMailMessage(mail: MailMessage): Promise<MailMessage> {
		return idbSrvc.openDb<IMailsIdb>()
			.then((idb) => idb.put<'messages'>('messages', mail))
			.then((_) => mail);
	}

	public saveMailMessages(mails: MailMessage[]): Promise<MailMessage[]> {
		if (mails.length < 1) return Promise.resolve([]);
		const cCopy = [...mails];
		const mail = cCopy.shift();
		return this.saveMailMessage(mail!)
			.then((c1) => new Promise((resolve, reject) => {
				if (cCopy.length === 0) resolve([c1]);
				else {
					this.saveMailMessages(cCopy)
						.then((r) => resolve([c1].concat(r)))
						.catch((e) => reject(e));
				}
			}));
	}

	public getConversation(id: string): Promise<Conversation|undefined> {
		return idbSrvc.openDb<IMailsIdb>()
			.then((idb) => idb.get<'conversations'>('conversations', id));
	}

	public getMessages(msgIds: string[]): Promise<{[p: string]: MailMessage}> {
		return idbSrvc.openDb<IMailsIdb>()
			.then((db) => Promise.all(
				reduce<string, Promise<MailMessage|undefined>[]>(
					msgIds,
					(r, v, k) => {
						r.push(db.get<'messages'>('messages', v));
						return r;
					},
					[]
				)
			))
			.then((msgs) => reduce<MailMessage|undefined, {[id: string]: MailMessage}>(
				msgs,
				(r, v, k) => {
					if (!v) return r;
					r[v.id] = v;
					return r;
				},
				{}
			));
	}
}
