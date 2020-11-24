/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import React, { lazy, useEffect } from 'react';
import {
	setCreateOptions, setRoutes, store
} from '@zextras/zapp-shell';
import { combineReducers } from '@reduxjs/toolkit';
import { report } from './commons/report-exception';
import  { syncSliceReducer, startSync } from './store/sync-slice';
import { folderSliceReducer } from './store/folders-slice';
import { editorSliceRecucer } from './store/editor-slice';
import { SetMainMenuItems } from './views/secondary-bar/set-main-menu-items';
import { conversationsSliceReducer } from './store/conversations-slice';
import { messageSliceReducer } from './store/messages-slice';

const lazyFolderView = lazy(() => (import(/* webpackChunkName: "mails-folder-view" */ './views/folder/mails-folder-view')));
const lazyEditView = lazy(() => (import(/* webpackChunkName: "mails-edit-view" */ './views/edit/edit-view')));

export default function App() {
	console.log('Hello from mails');

	window.onerror = (msg, url, lineNo, columnNo, error) => {
		report(error);
	};

	useEffect(() => {
		store.setReducer(
			combineReducers({
				folders: folderSliceReducer,
				sync: syncSliceReducer,
				conversations: conversationsSliceReducer,
				editors: editorSliceRecucer,
				messages: messageSliceReducer
			}),
		);
	}, []);

	useEffect(() => {
		store.store.dispatch(startSync());

		setRoutes([
			{
				route: '/folder/:folderId',
				view: lazyFolderView,
			},
			{
				route: '/',
				view: lazyFolderView,
			},
			{
				route: '/edit/:id',
				view: lazyEditView,
			},
			{
				route: '/new',
				view: lazyEditView,
			},
		]);

		setCreateOptions([{
			id: 'create-mail',
			label: 'New Mail',
			app: {
				boardPath: '/new',
				getPath: () => {
					const splittedLocation = window.top.location.pathname.split('/folder');
					return `${splittedLocation[1] ? `/folder${splittedLocation[1]}` : ''}?edit=new`;
				},
			},
		}]);
	}, []);

	return (
		<SetMainMenuItems />
	);
}
