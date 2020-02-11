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
import { serviceWorkerSrvc } from '@zextras/zapp-shell/service';
import { addMainMenuItem, registerRoute } from '@zextras/zapp-shell/router';
import { fc } from '@zextras/zapp-shell/fc';

import App, { ROUTE as mainRoute } from './components/App';
import MailsIdbService from './idb/MailsIdbService';
import MailsService from './MailsService';
import MailsNetworkService from './network/MailsNetworkService';

export default function app() {
	const idbSrvc = new MailsIdbService();
	const networkSrvc = new MailsNetworkService(
		idbSrvc
	);
	const mailsSrvc = new MailsService(
		idbSrvc,
		networkSrvc
	);
	console.log('HI!');
	fc.subscribe(console.log);
	addMainMenuItem(
		'EmailOutline',
		'Mails',
		'/mails/folder/Inbox',
		mailsSrvc.menuFolders
	);
	registerRoute(mainRoute, App, { mailsSrvc });
	serviceWorkerSrvc.registerAppServiceWorker(
		'mails-sw.js'
	);
}
