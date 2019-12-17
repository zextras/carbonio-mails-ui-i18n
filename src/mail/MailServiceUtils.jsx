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
import {
	ChatBubbleOutlined,
	DeleteOutline, FolderOutlined,
	InboxOutlined,
	InsertDriveFileOutlined,
	ReportOutlined,
	SendOutlined
} from '@material-ui/icons';
import { map } from 'lodash';

const getFolderIcon = (f) => {
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
};

export const convertFolderToMenuItem = (f) => ({
	icon: getFolderIcon(f),
	label: f.name,
	to: encodeURI(`/mail/folder${f.path}`),
	id: `folder-${f.id}`,
	children: map(
		f.children || [],
		convertFolderToMenuItem
	)
});
