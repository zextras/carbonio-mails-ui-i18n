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

export default function SetMainMenuItems() {
	useSetMainMenuItems();
	return null;
}

function useSetMainMenuItems() {
	const { t } = useTranslation();
	const allFolders = useSelector(selectAllFolders);

	const folders = reduce(allFolders, (a, c) => {
		a.push({
			id: c.zid,
			parentId: c.parentZid,
			label: c.name,
			children: c.items || [],
			badgeCounter: c.unreadedNotifications || 0,
			to: `/folder/${c.zid}`
		});
		return a;
	}, []);

	useEffect(() => {
		const nestedCalendars = nest(folders, '1');
		const trashItem = remove(nestedCalendars, (c) => c.id === '3'); // move Trash folder to the end
		const allItems = nestedCalendars.concat(trashItem);

		setMainMenuItems([{
			id: 'folder-main',
			icon: 'CalendarOutline',
			to: '/view',
			label: 'folder',
			children: allItems,
		}]);
	}, [folders]);
}

function nest(items, id) {
	return map(
		filter(items, (item) => item.parentId === id),
		(item) => ({ ...item, children: nest(items, item.id) })
	);
}
