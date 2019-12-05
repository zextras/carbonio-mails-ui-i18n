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
	ISyncItemParser
} from '@zextras/zapp-shell/lib/sync/ISyncService';
import { INotificationParser } from '@zextras/zapp-shell/lib/network/INetworkService';
import {
	map,
	forEach,
	flattenDeep,
	filter as loFilter,
	reduce,
	forOwn,
	sortBy
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
import { IConvObj, IGetMsgReq, IGetMsgResp, normalizeConversation, normalizeMessage } from '../IMailSoap';
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
			filter<IFCEvent<{}>>((e) => e.event === 'app:all-loaded')
		).subscribe(() => this._startup().then(() => undefined));
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

	private async _onItemDeleted({ data: id }: IFCEvent<string>): Promise<void> {
		const db = await openDb<IMailIdbSchema>();
		const msg = await db.get('mails', id);
		const folder = await db.get('folders', id);
		if (msg) {
			await db.delete('mails', id);
			fcSink<IMailItemDeletedEv>('mail:item:deleted', { id });
			fcSink<IMailFolderUpdatedEv>('mail:folder:updated', { id: msg.folder });
		}
		else if (folder) {
			await db.delete('folders', id);
			fcSink<IMailFolderDeletedEv>('mail:folder:deleted', { id });
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

	private async _getAllMailRoots(): Promise<Array<IFolderSchmV1>> {
		const resp = await sendSOAPRequest<IGetFolderReq, IGetFolderRes>('GetFolder', {
			// depth: 2,
			view: 'message',
			folder: {
				l: '1'
			},
		}, 'urn:zimbraMail');
		const folders = normalizeFolder<IFolderSchmV1>(1, resp.folder[0]);
		const db = await openDb<IMailIdbSchema>();
		const tx = db.transaction<'folders'>('folders', 'readwrite');
		forEach(
			folders,
			(f) => tx.store.put(f)
		);
		await tx.done;
		await this._buildAndEmitFolderTree();
		return folders;
	}

	private async _fetchFolder(id: string): Promise<string> {
		const resp = await sendSOAPRequest<IGetFolderReq, IGetFolderRes>('GetFolder', {
			// depth: 2,
			view: 'message',
			folder: {
				l: id
			},
		}, 'urn:zimbraMail');
		const folders = normalizeFolder<IFolderSchmV1>(1, resp.folder[0]);
		const db = await openDb<IMailIdbSchema>();
		const tx = db.transaction('folders', 'readwrite');
		forEach(
			folders,
			(f) => tx.store.put(f)
		);
		await tx.done;
		await this._buildAndEmitFolderTree();
		forEach(
			folders,
			(f) => fcSink<IMailFolderUpdatedEv>('mail:folder:updated', { id: f.id })
		);
		return '';
	}

	private _fetchMsg: (id: string) => Promise<string> = async (id) => {
		const resp = await sendSOAPRequest<IGetMsgReq, IGetMsgResp>('GetMsg', {
			m: {
				id
			},
		}, 'urn:zimbraMail');
		const msg = normalizeMessage(resp.m[0]);
		const db = await openDb<IMailIdbSchema>();
		await db.put('mails', msg);
		fcSink<IMailItemUpdatedEv>('mail:item:updated', { id: msg.id });
		return msg.folder;
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

	public getFolderContent(path: string): BehaviorSubject<Array<IConvSchm>> {
		if (!this._folderContentCache[path]) {
			this._folderContentCache[path] = new BehaviorSubject<Array<IConvSchm>>([]);
			this._fetchFolderConversationsFromServer(path).then(
				(convs) => this._storeConversationsIntoIdb(convs).then(
					() => this._fetchFolderConversationsFromIdb(path).then(
						(r2) => this._folderContentCache[path].next(r2)
					)
				)
			);
		}
		return this._folderContentCache[path];
	}

	private async _fetchFolderConversationsFromServer(path: string): Promise<Array<IConvSchm>> {
		const resp = await sendSOAPRequest<ISearchReq, ISearchConvResp>('Search', {
			query: `in:"${path}"`,
			limit: 100,
			fullConversation: 1,
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
			const conversations = await db.getAllFromIndex('conversations', 'folder', folder.id);
			return sortBy(
				conversations,
				['date']
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
		// TODO: Actively update the subject on notification handled
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
		return subject;
	}
}
