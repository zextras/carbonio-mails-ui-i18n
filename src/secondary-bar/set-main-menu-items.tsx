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

import React, { useEffect } from 'react';
import { setMainMenuItems } from '@zextras/zapp-shell';
import { useSelector } from 'react-redux';
import { reduce, map, filter } from 'lodash';
import { selectFolders } from '../store/folders-slice';
import { Folder } from '../types/folder';
import { MailsFolderMap } from '../types/state';

export default function SetMainMenuItems(): null {
	useSetMainMenuItems();
	return null;
}

function useSetMainMenuItems(): void {
	const allFolders: MailsFolderMap = useSelector(selectFolders);

	const folders = reduce(allFolders, (a: Array<any>, c: Folder) => {
		a.push({
			id: c.id,
			parent: c.parent,
			label: c.name,
			children: [],
			badgeCounter: c.unreadCount,
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
