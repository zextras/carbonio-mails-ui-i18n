/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

/* eslint no-param-reassign: ["error", {"props": true, "ignorePropertyModificationsFor": ["c"] }] */

import React, { useEffect } from 'react';
import { setMainMenuItems } from '@zextras/zapp-shell';
import { useSelector } from 'react-redux';
import {
	remove, reduce, forEach, map, filter, every
} from 'lodash';
import { useTranslation } from 'react-i18next';
import { selectAllFolders } from '../store/folders-slice';
import MailsFolder from '../types/mails-folder';

export default function SetMainMenuItems(): null {
	useSetMainMenuItems();
	return null;
}

function useSetMainMenuItems(): void {
	const { t } = useTranslation();
	const allFolders = useSelector(selectAllFolders);

	const folders = reduce(allFolders, (a: Array<any>, c: MailsFolder) => {
		a.push({
			id: c.id,
			parent: c.parent,
			label: c.name,
			children: [],
			badgeCounter: c.unreadCount || 0,
			to: `/folder/${c.id}`
		});
		return a;
	}, []);

	useEffect(() => {
		const nestedCalendars = nest(folders, '1');

		setMainMenuItems([{
			id: 'mails-main',
			icon: 'EmailOutline',
			to: '/folder/2', // Default route to `Inbox`
			label: 'Mails',
			children: nestedCalendars,
		}]);
	}, [folders]);
}

function nest(items: Array<any>, id: string): Array<any> {
	return map(
		filter(items, (item) => item.parent === id),
		(item) => ({ ...item, children: nest(items, item.id) })
	);
}
