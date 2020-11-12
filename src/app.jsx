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
import syncSliceReducer, { startSync } from './store/sync-slice';
import foldersSliceReducer from './store/folders-slice';
import editorsSliceReducer from './store/editor-slice';
import SetMainMenuItems from './secondary-bar/set-main-menu-items';
import conversationsSliceReducer from './store/conversations-slice';

const lazyFolderView = lazy(() => (import(/* webpackChunkName: "mails-folder-view" */ './folder/mails-folder-view')));
const lazyEditView = lazy(() => (import(/* webpackChunkName: "mails-edit-view" */ './edit/edit-view')));

export default function App() {
	console.log('Hello from mails');

	window.onerror = (msg, url, lineNo, columnNo, error) => {
		report(error);
	};

	useEffect(() => {
		// TODO: add his type using typescript: https://react-redux.js.org/using-react-redux/static-typing
		store.setReducer(
			combineReducers({
				folders: foldersSliceReducer,
				sync: syncSliceReducer,
				conversations: conversationsSliceReducer,
				editors: editorsSliceReducer
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

	useEffect(() => {
		// const db = new MailsDb(network.soapFetch);
		// const syncProtocol = new MailsDbSoapSyncProtocol(db, network.soapFetch);
		// db.registerSyncProtocol('soap-mails', syncProtocol);
		// db.syncable.connect('soap-mails', '/service/soap/SyncRequest');
		//
		// setAppContext({
		// 	db,
		// });

		// db
		// 	.observe(() => db.folders.where({ parent: '1' }).sortBy('name'))
		// 	.subscribe((folders) => mainMenuItems(folders, db));

		// setRoutes([
		// 	{
		// 		route: '/folder/:folderId',
		// 		view: lazyFolderView,
		// 	},
		// 	{
		// 		route: '/',
		// 		view: lazyFolderView,
		// 	},
		// 	{
		// 		route: '/edit/:id',
		// 		view: lazyEditView,
		// 	},
		// 	{
		// 		route: '/new',
		// 		view: lazyEditView,
		// 	},
		// ]);
		//
		// setCreateOptions([{
		// 	id: 'create-mail',
		// 	label: 'New Mail',
		// 	app: {
		// 		boardPath: '/new',
		// 		getPath: () => {
		// 			const splittedLocation = window.top.location.pathname.split('/folder');
		// 			return `${splittedLocation[1] ? `/folder${splittedLocation[1]}` : ''}?edit=new`;
		// 		},
		// 	},
		// }]);
	}, []);

	return (
		<SetMainMenuItems />
	);
}
