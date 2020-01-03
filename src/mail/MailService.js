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
/* @flow */
import { BehaviorSubject } from 'rxjs';
import { IMainSubMenuItemData } from '@zextras/zapp-shell/lib/router/IRouterService';
import { fcSink } from '@zextras/zapp-shell/fc';
import { map } from 'lodash';
import { IMailFolder, IMailSyncService } from '../sync/IMailSyncService';
import { IConvSchm, IMailSchm } from '../idb/IMailSchema';
import { convertFolderToMenuItem } from './MailServiceUtils';

function _findFolderByPath(path, folders) {
	for (let i = 0; i < folders.length; i += 1) {
		if (folders[i].path === path) return folders[i];
		if (folders[i].children) {
			const child = _findFolderByPath(path, folders[i].children);
			if (child) return child;
		}
	}
	return undefined;
}

function _findFolderById(id: string, folders: Array<IMailFolder>): ?IMailFolder {
	for (let i = 0; i < folders.length; i += 1) {
		if (folders[i].id === id) return folders[i];
		if (folders[i].children) {
			const child = _findFolderById(id, folders[i].children);
			if (child) return child;
		}
	}
	return undefined;
}

export class MailService {
	mainMenuChildren = new BehaviorSubject<Array<IMainSubMenuItemData>>([]);

	_syncSrvc: IMailSyncService;

	_locks: {[path: string]: boolean};

	constructor(syncSrvc: IMailSyncService) {
		this._syncSrvc = syncSrvc;
		this._syncSrvc.folders.subscribe(
			(folders) => {
				this.mainMenuChildren.next(
					map(
						folders,
						convertFolderToMenuItem
					)
				);
			}
		);
		this._locks = {};
	}

	setMessageRead(mail: IMailSchm, click: boolean): void {
		if (!this._locks[mail.conversationId] || click) {
			this._locks[mail.conversationId] = false;
			fcSink('sync:operation:push', {
				opType: 'soap',
				opData: {},
				description: `Mark as Read (${mail.subject})`,
				request: {
					command: 'MsgAction',
					urn: 'urn:zimbraMail',
					data: {
						action: {
							id: mail.id,
							op: `${mail.read ? '!' : ''}read`
						}
					}
				}
			});
		}
	}

	setConversationRead(id: string, read: boolean): void {
		this._locks[id] = true;
		fcSink('sync:operation:push', {
			opType: 'soap',
			opData: {},
			description: 'Mark conversation as Read',
			request: {
				command: 'ConvAction',
				urn: 'urn:zimbraMail',
				data: {
					action: {
						id,
						op: `${read ? '' : '!'}read`
					}
				}
			}
		});
	}

	getFolderBreadcrumbs(path: string): [?IMailFolder, Array<IMailFolder>] {
		const folders = this._syncSrvc.folders.getValue();

		const currFolder = _findFolderByPath(path, folders);
		if (!currFolder) return [undefined, []];

		const crumbs = [];
		let parentId: ?string = currFolder.parent;
		while (parentId) {
			const parent: ?IMailFolder = _findFolderById(parentId, folders);
			if (parent) {
				crumbs.unshift(parent);
				parentId = parent.parent;
			}
			else {
				parentId = undefined;
			}
		}
		return [currFolder, crumbs];
	}

	folderContent(path: string): BehaviorSubject<Array<IConvSchm>> {
		return this._syncSrvc.getFolderContent(path);
	}
}
