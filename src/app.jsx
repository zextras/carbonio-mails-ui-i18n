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

import React, { lazy } from 'react';
import {
	setMainMenuItems,
	setRoutes,
	setCreateOptions,
	setAppContext,
	network
} from '@zextras/zapp-shell';
import { MailsDb } from './db/mails-db';
import { MailsDbSoapSyncProtocol } from './db/mails-db-soap-sync-protocol';
import mainMenuItems from './main-menu-items';

const lazyFolderView = lazy(() => (import(/* webpackChunkName: "mails-folder-view" */ './folder/mails-folder-view')));
const lazyEditView = lazy(() => (import(/* webpackChunkName: "mails-edit-view" */ './edit/edit-view')));

export default function app() {
	console.log('Hello from mails');

	const db = new MailsDb(network.soapFetch);
	const syncProtocol = new MailsDbSoapSyncProtocol(db, network.soapFetch);
	db.registerSyncProtocol('soap-mails', syncProtocol);
	db.syncable.connect('soap-mails', '/service/soap/SyncRequest');

	setAppContext({
		db
	});

	db
		.observe(() => db.folders.where({ parent: '1' }).sortBy('name'))
		.subscribe((folders) => mainMenuItems(folders, db));

	setAppContext({
		db
	});

	setRoutes([
		{
			route: '/folder/:folderId',
			view: lazyFolderView
		},
		{
			route: '/',
			view: lazyFolderView
		},
		{
			route: '/edit/:id',
			view: lazyEditView
		},
		{
			route: '/new',
			view: lazyEditView
		}
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
		}
	}]);
}
