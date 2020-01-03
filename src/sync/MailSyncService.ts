/* eslint-disable class-methods-use-this */
/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2019 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import {
	registerSyncItemParser,
} from '@zextras/zapp-shell/sync';
import { registerNotificationParser, sendSOAPRequest } from '@zextras/zapp-shell/network';
import {
	ISyncItemParser, ISyncOpCompletedEv
} from '@zextras/zapp-shell/lib/sync/ISyncService';
import { INotificationParser } from '@zextras/zapp-shell/lib/network/INetworkService';
import {
	map,
	forEach,
	flattenDeep,
	filter as loFilter,
	reduce,
	forOwn,
	orderBy,
} from 'lodash';
import { openDb } from '@zextras/zapp-shell/idb';
import { fcSink, fc } from '@zextras/zapp-shell/fc';
import { filter } from 'rxjs/operators';
import { IFCEvent } from '@zextras/zapp-shell/lib/fc/IFiberChannel';
import {
	IGetFolderReq,
	IGetFolderRes,
	ISoapFolderCreatedNotificationObj,
	ISoapFolderModifiedNotificationObj,
	ISoapFolderObj
} from '@zextras/zapp-shell/lib/network/ISoap';
import { IFolderSchmV1 } from '@zextras/zapp-shell/lib/sync/IFolderSchm';
import { normalizeFolder } from '@zextras/zapp-shell/utils';
import { BehaviorSubject } from 'rxjs';
import {
	IConvObj,
	IGetMsgReq,
	IGetMsgResp,
	normalizeConversation,
	normalizeMessage,
	IMsgItemObj
} from '../IMailSoap';
import { IConvSchm, IMailIdbSchema, IMailSchm } from '../idb/IMailSchema';
import { IMailFolder, IMailSyncService, ISyncMailItemData } from './IMailSyncService';
import {
	IMailFolderDeletedEv,
	IMailFolderUpdatedEv,
	IMailItemDeletedEv,
	IMailItemUpdatedEv
} from '../IMailFCevents';
import { ISearchConvResp, ISearchReq } from './IMailSoap';

export class MailSyncService implements IMailSyncService {

	public folders: BehaviorSubject<Array<IMailFolder>> = new BehaviorSubject<Array<IMailFolder>>([]);

	private _conversationCache: {[path: string]: BehaviorSubject<Array<IMailSchm>>} = {};

	private _convDataCache: {[path: string]: BehaviorSubject<IConvSchm>} = {};

	private _folderContentCache: {[path: string]: BehaviorSubject<Array<IConvSchm>>} = {};

	constructor() {
		registerNotificationParser('m', this._notificationParser);
		registerNotificationParser('folder', this._folderNotificationParser);
		registerSyncItemParser('m', this._syncItemParser);
		registerSyncItemParser('folder', this._syncFolderParser);
		fc.pipe(
			filter<IFCEvent<string>>((e) => e.event === 'notification:item:deleted')
		)
			.subscribe((ev) => this._onItemDeleted(ev).then(() => undefined));

		fc.pipe(
			filter<IFCEvent<IMailItemUpdatedEv>>((e) => e.event === 'mail:item:updated')
		)
			.subscribe((ev) => this._onItemUpdated(ev).then(() => undefined));

		fc.pipe(
			filter<IFCEvent<IMailFolderUpdatedEv>>((e) => e.event === 'mail:folder:updated')
		)
			.subscribe((ev) => this._onFolderUpdated(ev).then(() => undefined));

		fc.pipe(
			filter<IFCEvent<{}>>((e) => e.event === 'app:all-loaded')
		).subscribe(() => this._startup().then(() => undefined));
		fc.pipe(
			filter<IFCEvent<ISyncOpCompletedEv<{ folder: Array<ISoapFolderObj> }>>>(
				(e) => (
					e.event === 'sync:operation:completed'
					&& e.data.operation.opData
					&& ((e.data.operation.opData as { opName?: string }).opName === 'getMailRoots' || (e.data.operation.opData as { opName?: string }).opName === 'fetchFolder')
				)
			)
		).subscribe(async (e) => {
			const folders = normalizeFolder<IFolderSchmV1>(1, e.data.result.folder[0]);
			const db = await openDb<IMailIdbSchema>();
			const tx = db.transaction<'folders'>('folders', 'readwrite');
			forEach(
				folders,
				(f) => tx.store.put(f)
			);
			await tx.done;
			await this._buildAndEmitFolderTree();
			if ((e.data.operation.opData as { opName?: string }).opName === 'fetchFolder') {
				forEach(
					folders,
					(f) => {
						this._updateFolderContent(f.path);
						fcSink<IMailFolderUpdatedEv>('mail:folder:updated', { id: f.id });
					}
				);
			}
		});
		fc.pipe(
			filter<IFCEvent<ISyncOpCompletedEv<{ m: Array<IMsgItemObj> }>>>(
				(e) => (
					e.event === 'sync:operation:completed'
					&& e.data.operation.opData
					&& (e.data.operation.opData as { opName?: string }).opName === 'getMsg'
				)
			)
		).subscribe(async (e) => {
			const msg = normalizeMessage(e.data.result.m[0]);
			const db = await openDb<IMailIdbSchema>();
			await db.put('mails', msg);
			fcSink<IMailItemUpdatedEv>('mail:item:updated', { id: msg.id });
		});
	}

	private _notificationParser: INotificationParser<ISyncMailItemData> = async (type, mod) => {
		if (type === 'created') {
			await this._fetchMsg(mod.id);
		}
		else if (type === 'modified') {
			await this._fetchMsg(mod.id);
		}
	};

	private _syncItemParser: ISyncItemParser<ISyncMailItemData> = async (mods) => {
		await Promise.all(
			map(mods, ({ id }) => this._fetchMsg(id))
		);
	};

	private _syncFolderParser: ISyncItemParser<ISoapFolderObj> = async (fmod) => {
		const folders = flattenDeep(
			map(
				loFilter(fmod, (f) => f.view === 'message'),
				(f) => normalizeFolder<IFolderSchmV1>(1, f)
			)
		);
		const db = await openDb<IMailIdbSchema>();
		const tx = db.transaction('folders', 'readwrite');
		forEach(
			folders,
			(f) => tx.store.put(f)
		);
		await tx.done;
		forEach(
			folders,
			(f) => fcSink<IMailFolderUpdatedEv>('mail:folder:updated', { id: f.id })
		);
	};

	private async _onItemUpdated({ data }: IFCEvent<IMailItemUpdatedEv>): Promise<void> {
		const db = await openDb<IMailIdbSchema>();
		const mail = await db.get('mails', data.id);
		if (mail && this._conversationCache[mail.conversationId]) {
			const convMails = await db.transaction('mails', 'readonly').store.index('conversation').getAll(mail.conversationId);
			this._conversationCache[mail.conversationId].next(convMails);
		}
	}

	private async _onFolderUpdated({ data }: IFCEvent<IMailFolderUpdatedEv>): Promise<void> {
		const db = await openDb<IMailIdbSchema>();
		const folder = await db.get('folders', data.id);
		if (folder && this._folderContentCache[folder.path]) {
			this._fetchFolderConversationsFromIdb(folder.path).then(
				(r) => this._folderContentCache[folder.path].next(r)
			);
		}
	}

	private async _onItemDeleted({ data: id }: IFCEvent<string>): Promise<void> {
		const db = await openDb<IMailIdbSchema>();
		const msg = await db.get('mails', id);
		const folder = await db.get('folders', id);
		const conv = await db.get('conversations', id);
		if (msg) {
			await db.delete('mails', id);
			fcSink<IMailItemDeletedEv>('mail:item:deleted', { id });
			fcSink<IMailFolderUpdatedEv>('mail:folder:updated', { id: msg.folder });
		}
		else if (folder) {
			await db.delete('folders', id);
			fcSink<IMailFolderDeletedEv>('mail:folder:deleted', { id });
		}
		else if (conv) {
			await db.delete('conversations', id);
			fcSink<IMailItemDeletedEv>('mail:item:deleted', { id });
			forEach(conv.folder, (f: string): void => fcSink<IMailFolderUpdatedEv>('mail:folder:updated', { id: f }));
		}
	}

	private async _startup(): Promise<void> {
		const db = await openDb<IMailIdbSchema>();
		const folders = await db.getAll('folders');
		if (folders.length < 1) {
			await this._getAllMailRoots();
		}
		else {
			await this._buildAndEmitFolderTree();
		}
	}

	private async _getAllMailRoots(): Promise<void> {
		fcSink('sync:operation:push', {
			opType: 'soap',
			opData: {
				opName: 'getMailRoots'
			},
			description: 'Get Folders',
			request: {
				command: 'GetFolder',
				urn: 'urn:zimbraMail',
				data: {
					view: 'message',
					folder: {
						l: '1'
					}
				}
			}
		});
	}

	private async _fetchFolder(id: string): Promise<void> {
		fcSink('sync:operation:push', {
			opType: 'soap',
			opData: { opName: 'fetchFolder', folderId: id },
			description: `Fetch Folder (${id})`,
			request: {
				command: 'GetFolder',
				urn: 'urn:zimbraMail',
				data: {
					view: 'message',
					folder: {
						l: id
					},
				}
			}
		});
	}

	private _fetchMsg: (id: string) => Promise<void> = async (id) => {
		fcSink('sync:operation:push', {
			opType: 'soap',
			opData: { opName: 'getMsg', msgId: id },
			description: `Get Message Folder (${id})`,
			request: {
				command: 'GetMsg',
				urn: 'urn:zimbraMail',
				data: {
					m: {
						id
					}
				}
			}
		});
	};

	private _folderNotificationParser: INotificationParser<ISoapFolderCreatedNotificationObj | ISoapFolderModifiedNotificationObj> = async (e, evData) => {
		// eslint-disable-next-line default-case
		switch (e) {
			case 'created': {
				if ((evData as ISoapFolderCreatedNotificationObj).view === 'message') {
					await this._handleMailFolderCreated(evData as ISoapFolderCreatedNotificationObj);
				}
				break;
			}
			case 'modified': {
				const db = await openDb<IMailIdbSchema>();
				if (await db.get('folders', evData.id)) {
					await this._handleMailFolderModified(evData as ISoapFolderModifiedNotificationObj);
				}
				break;
			}
		}
	};

	private async _handleMailFolderCreated(evData: ISoapFolderCreatedNotificationObj): Promise<void> {
		await this._fetchFolder(evData.id);
	}

	private async _handleMailFolderModified(evData: ISoapFolderModifiedNotificationObj): Promise<void> {
		await this._fetchFolder(evData.id);
	}

	private async _buildAndEmitFolderTree(): Promise<void> {
		const db = await openDb<IMailIdbSchema>();
		const folders = await db.getAll('folders');
		const fMap: {[id: string]: IMailFolder} = reduce(
			folders,
			(tmpMap, f) => ({ ...tmpMap, [f.id]: { ...f, children: [] } }),
			{}
		);
		forOwn(fMap, (f, id) => {
			if (fMap[f.parent]) fMap[f.parent].children.push(f);
		});
		this.folders.next(
			loFilter(
				map(fMap),
				(f) => f.parent === '1'
			)
		);
	}

	private _updateFolderContent(path: string): void {
		if (this._folderContentCache[path]) {
			this._fetchFolderConversationsFromServer(path).then(
				(convs) => this._storeConversationsIntoIdb(convs).then(
					() => this._fetchFolderConversationsFromIdb(path).then(
						(r2) => this._folderContentCache[path].next(r2)
					)
				)
			);
		}
	}

	public getFolderContent(path: string): BehaviorSubject<Array<IConvSchm>> {
		if (!this._folderContentCache[path]) {
			this._folderContentCache[path] = new BehaviorSubject<Array<IConvSchm>>([]);
			this._updateFolderContent(path);
		}
		return this._folderContentCache[path];
	}

	private async _fetchFolderConversationsFromServer(path: string): Promise<Array<IConvSchm>> {
		const resp = await sendSOAPRequest<ISearchReq, ISearchConvResp>('Search', {
			query: `in:"${path}"`,
			limit: 100,
			fullConversation: 1,
			recip: 2,
			types: 'conversation'
		}, 'urn:zimbraMail');
		return reduce<IConvObj, Array<IConvSchm>>(
			resp.c,
			(res, conv) => {
				const normConv = normalizeConversation(conv);
				return [...res, normConv];
			},
			[]
		);
	}

	private async _fetchFolderConversationsFromIdb(path: string): Promise<Array<IConvSchm>> {
		const db = await openDb<IMailIdbSchema>();
		const folder = await db.getFromIndex('folders', 'path', path);
		if (folder) {
			const conversations = await db.transaction('conversations', 'readonly').store.index('folder').getAll(folder.id);
			return orderBy(
				conversations,
				['date'],
				['desc']
			);
		}
		return [];
	}

	private async _storeConversationsIntoIdb(convs: Array<IConvSchm>): Promise<void> {
		const db = await openDb<IMailIdbSchema>();
		const tx = db.transaction('conversations', 'readwrite');
		forEach(
			convs,
			(c) => tx.store.put(c)
		);
		await tx.done;
	}

	public getConversationMessages(convId: string): BehaviorSubject<Array<IMailSchm>> {
		if (this._conversationCache[convId]) {
			return this._conversationCache[convId];
		}
		const subject = new BehaviorSubject<Array<IMailSchm>>([]);
		openDb<IMailIdbSchema>().then(
			async (db) => {
				const msgs = await db.getAllFromIndex('mails', 'conversation', convId);
				subject.next(msgs);
				const conv = await db.get('conversations', convId);
				if (conv) {
					await Promise.all(
						forEach(
							conv.messages,
							(mid) => this._fetchMsg(mid)
						)
					);
					const msgs2 = await db.getAllFromIndex('mails', 'conversation', convId);
					subject.next(msgs2);
				}
			}
		);
		this._conversationCache[convId] = subject;
		return this._conversationCache[convId];
	}

	public getConversationData(convId: string): BehaviorSubject<IConvSchm> {
		if (this._convDataCache[convId]) {
			return this._convDataCache[convId];
		}
		const subject = new BehaviorSubject<IConvSchm>({} as IConvSchm);
		openDb<IMailIdbSchema>().then(
			async (db) => {
				const conv = await db.get('conversations', convId);
				subject.next(conv as IConvSchm);
			}
		);
		this._convDataCache[convId] = subject;
		return this._convDataCache[convId];
	}
}
