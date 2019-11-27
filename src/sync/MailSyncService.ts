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
	registerSyncFolderParser,
	syncFolderById
} from '@zextras/zapp-shell/sync';
import { registerNotificationParser, sendSOAPRequest } from '@zextras/zapp-shell/network';
import {
	ISyncFolderParser,
	ISyncItemParser
} from '@zextras/zapp-shell/lib/sync/ISyncService';
import { INotificationParser } from '@zextras/zapp-shell/lib/network/INetworkService';
import { map, uniq, forEach } from 'lodash';
import { openDb } from '@zextras/zapp-shell/idb';
import { fcSink, fc } from '@zextras/zapp-shell/fc';
import { filter } from 'rxjs/operators';
import { IFCEvent } from '@zextras/zapp-shell/lib/fc/IFiberChannel';
import {
	IGetFolderReq, IGetFolderRes,
	ISoapFolderCreatedNotificationObj,
	ISoapFolderModifiedNotificationObj
} from '@zextras/zapp-shell/lib/network/ISoap';
import { IFolderSchmV1 } from '@zextras/zapp-shell/lib/sync/IFolderSchm';
import { normalizeFolder } from '@zextras/zapp-shell/utils';
import { IGetMsgReq, IGetMsgResp, normalizeMessage } from '../IMailSoap';
import { IMailIdbSchema } from '../idb/IMailSchema';
import { IMailSyncService, ISyncMailFolderData, ISyncMailItemData } from './IMailSyncService';
import {
	IMailFolderDeletedEv,
	IMailFolderUpdatedEv,
	IMailItemDeletedEv,
	IMailItemUpdatedEv
} from '../IMailFCevents';

export class MailSyncService implements IMailSyncService {
	constructor() {
		registerNotificationParser('m', this._notificationParser);
		registerNotificationParser('folder', this._folderNotificationParser);
		registerSyncItemParser('m', this._syncItemParser);
		registerSyncFolderParser('m', this._syncFolderParser);
		fc.pipe(
			filter<IFCEvent<string>>((e) => e.event === 'notification:item:deleted')
		)
			.subscribe(this._onItemDeleted);

		syncFolderById('2'); // Always sync the inbox folder
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

	private _syncFolderParser: ISyncFolderParser<ISyncMailFolderData> = async (folderId, e) => {
		const folders = await Promise.all(map(
			e[0].ids.split(','),
			this._fetchMsg
		));
		await Promise.all(
			map(
				uniq(folders),
				(id) => this._fetchFolder(id)
			)
		);
	};

	private _onItemDeleted: (ev: IFCEvent<string>) => void = (ev) => {
		(async (id: string): Promise<void> => {
			const db = await openDb<IMailIdbSchema>();
			const msg = await db.get('mails', id);
			if (msg) {
				await db.delete('mails', id);
				fcSink<IMailItemDeletedEv>('mail:item:deleted', { id });
				fcSink<IMailFolderUpdatedEv>('mail:folder:updated', { id: msg.folder });
			}
			else if (await db.get('folders', id)) {
				await db.delete('folders', id);
				fcSink<IMailFolderDeletedEv>('mail:folder:deleted', { id });
			}
		})(ev.data).then((r) => undefined);
	};

	private async _fetchFolder(id: string): Promise<string> {
		const resp = await sendSOAPRequest<IGetFolderReq, IGetFolderRes>('GetFolder', {
			depth: 2,
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
}
