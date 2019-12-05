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

import React, { ReactElement } from 'react';
import {
	FolderOutlined,
	InboxOutlined,
	DeleteOutline,
	ReportOutlined,
	SendOutlined,
	InsertDriveFileOutlined,
	ChatBubbleOutlined
} from '@material-ui/icons';
import { BehaviorSubject } from 'rxjs';
import { IMainSubMenuItemData } from '@zextras/zapp-shell/lib/router/IRouterService';
import { map } from 'lodash';
import { IMailFolder, IMailSyncService } from '../sync/IMailSyncService';
import { IMailService } from './IMailService';
import { IConvSchm, IMailSchm } from '../idb/IMailSchema';

function _findFolderByPath(path: string, folders: Array<IMailFolder>): IMailFolder|undefined {
	for (let i = 0; i < folders.length; i += 1) {
		if (folders[i].path === path) return folders[i];
		if (folders[i].children) {
			const child = _findFolderByPath(path, folders[i].children);
			if (child) return child;
		}
	}
	return undefined;
}

function _findFolderById(id: string, folders: Array<IMailFolder>): IMailFolder|undefined {
	for (let i = 0; i < folders.length; i += 1) {
		if (folders[i].id === id) return folders[i];
		if (folders[i].children) {
			const child = _findFolderById(id, folders[i].children);
			if (child) return child;
		}
	}
	return undefined;
}

function _getFolderIcon(f: IMailFolder): ReactElement {
	switch (f.id) {
		case '2':
			return (<InboxOutlined />);
		case '3':
			return (<DeleteOutline />);
		case '4':
			return (<ReportOutlined />);
		case '5':
			return (<SendOutlined />);
		case '6':
			return (<InsertDriveFileOutlined />);
		case '14':
			return (<ChatBubbleOutlined />);
		default:
			return (<FolderOutlined />);
	}
}


function _convertFolderToMenuItem(f: IMailFolder): IMainSubMenuItemData {
	return {
		icon: _getFolderIcon(f),
		label: f.name,
		to: encodeURI(`/mail/folder${f.path}`),
		id: `folder-${f.id}`,
		children: map(
			f.children || [],
			_convertFolderToMenuItem
		)
	};
}

export class MailService implements IMailService {
	public mainMenuChildren = new BehaviorSubject<Array<IMainSubMenuItemData>>([]);

	constructor(private _syncSrvc: IMailSyncService) {
		_syncSrvc.folders.subscribe(
			(folders) => {
				this.mainMenuChildren.next(
					map(
						folders,
						_convertFolderToMenuItem
					)
				);
			}
		);
	}

	public getFolderBreadcrumbs(path: string): [IMailFolder|undefined, Array<IMailFolder>] {
		const folders = this._syncSrvc.folders.getValue();

		const currFolder = _findFolderByPath(path, folders);
		if (!currFolder) return [undefined, []];

		const crumbs = [];
		let parentId: string | undefined = currFolder.parent;
		while (parentId) {
			const parent: IMailFolder|undefined = _findFolderById(parentId, folders);
			if (parent)	{
				crumbs.unshift(parent);
				parentId = parent.parent;
			}
			else {
				parentId = undefined;
			}
		}
		return [currFolder, crumbs];
	}

	public folderContent(path: string): BehaviorSubject<Array<IConvSchm>> {
		return this._syncSrvc.getFolderContent(path);
	}
}
