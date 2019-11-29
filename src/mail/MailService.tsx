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
	InsertDriveFileOutlined
} from '@material-ui/icons';
import { BehaviorSubject } from 'rxjs';
import { IMainSubMenuItemData } from '@zextras/zapp-shell/lib/router/IRouterService';
import { map } from 'lodash';
import { IMailFolder, IMailSyncService } from '../sync/IMailSyncService';

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
		default:
			return (<FolderOutlined />);
	}
}


function _convertFolderToMenuItem(f: IMailFolder): IMainSubMenuItemData {
	return {
		icon: _getFolderIcon(f),
		label: f.name,
		to: `/mail/folder${f.path}`,
		id: `folder-${f.id}`,
		children: map(
			f.children || [],
			_convertFolderToMenuItem
		)
	};
}

export class MailService {
	public mainMenuChildren = new BehaviorSubject<Array<IMainSubMenuItemData>>([]);

	constructor(syncSrvc: IMailSyncService) {
		syncSrvc.folders.subscribe(
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
}
