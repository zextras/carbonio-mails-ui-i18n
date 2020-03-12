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

import React from 'react';
import { addMainMenuItem, registerRoute } from '@zextras/zapp-shell/router';
import { fc } from '@zextras/zapp-shell/fc';
import { syncOperations } from '@zextras/zapp-shell/sync';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';

import { cloneDeep, filter as loFilter, reduce } from 'lodash';
import App, { ROUTE as mainRoute } from './components/App';
import MailsIdbService from './idb/MailsIdbService';
import MailsService from './MailsService';
import MailsNetworkService from './network/MailsNetworkService';
import { calculateAbsPath } from './ISoap';

const _FOLDER_UPDATED_EV_REG = /mails:updated:folder/;
const _FOLDER_DELETED_EV_REG = /mails:deleted:folder/;

const subfolders = (folders, parentId) =>
	reduce(
		loFilter(
			folders,
			(folder) => folder.parent === parentId
		),
		(acc, folder) => {
			acc.push(
				{
					id: folder.id,
					label: folder.name,
					to: `/mails/folder${folder.path}`,
					children: subfolders(folders, folder.id)
				}
			);
			return acc;
		},
		[]
	);

export default function app() {
	fc.subscribe(console.log);

	const idbSrvc = new MailsIdbService();
	const networkSrvc = new MailsNetworkService(
		idbSrvc
	);
	const mailsSrvc = new MailsService(
		idbSrvc,
		networkSrvc
	);

	const folders = new BehaviorSubject({});
	const _folders = new BehaviorSubject({});
	const menuFolders = new BehaviorSubject([]);

	function _loadAllMailFolders() {
		idbSrvc.getAllFolders()
			.then((f) => _folders.next(f));
	}

	function _updateFolder(id) {
		idbSrvc.getFolderById(id)
			.then((f) => {
				if (f) _folders.next({ ..._folders.getValue(), [id]: f });
			});
	}

	function _deleteFolder(id) {
		const newVal = { ..._folders.getValue() };
		try {
			delete newVal[id];
		}
		catch (e) {}
		_folders.next(newVal);
	}

	fc
		.pipe(
			filter((e) => e.event === 'app:all-loaded')
		)
		.subscribe(() => _loadAllMailFolders());
	fc
		.pipe(filter((e) => _FOLDER_UPDATED_EV_REG.test(e.event)))
		.subscribe(({ data }) => _updateFolder(data.id));
	fc
		.pipe(filter((e) => _FOLDER_DELETED_EV_REG.test(e.event)))
		.subscribe(({ data }) => _deleteFolder(data.id));

	folders.subscribe(
		(f) => {
			menuFolders.next(
				reduce(
					loFilter(f, (folder) => folder.parent === '1'),
					(acc, folder) => {
						acc.push(
							{
								icon: 'EmailOutline',
								id: folder.id,
								label: folder.name,
								to: `/mails/folder${folder.path}`,
								children: subfolders(f, folder.id)
							}
						);
						return acc;
					},
					[]
				)
			);
		}
	);

	function _mergeFoldersAndOperations([
		_syncOperations,
		f
	]) {
		folders.next(
			reduce(
				_syncOperations,
				(r, v, k) => {
					switch (v.opData.operation) {
						case 'create-mail-folder':
							// eslint-disable-next-line no-param-reassign
							r[v.opData.id] = {
								_revision: 0,
								synced: true,
								id: v.opData.id,
								name: v.opData.name,
								parent: v.opData.parent,
								itemsCount: 0,
								unreadCount: 0,
								size: 0,
								path: calculateAbsPath(
									v.opData.id,
									v.opData.name,
									r,
									v.opData.parent
								)
							};
							return r;
						case 'delete-mail-folder':
							// eslint-disable-next-line no-param-reassign
							delete r[v.opData.id];
							// TODO: Remove the children
							return r;
						case 'move-mail-folder':
							// eslint-disable-next-line no-param-reassign
							r[v.opData.id] = { ...r[v.opData.id], parent: v.opData.parent };
							// TODO: Update the path and the children paths
							return r;
						case 'rename-mail-folder':
							// eslint-disable-next-line no-param-reassign
							r[v.opData.id] = { ...r[v.opData.id], name: v.opData.name };
							// TODO: Update the path and the children paths
							return r;
						default:
							return r;
					}
				},
				cloneDeep(f)
			)
		);
	}

	combineLatest([
		syncOperations,
		_folders
	]).subscribe(_mergeFoldersAndOperations);

	addMainMenuItem(
		'EmailOutline',
		'Mails',
		'/mails/folder/Inbox',
		menuFolders
	);
	registerRoute(mainRoute, App, { mailsSrvc });
}
