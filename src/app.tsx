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

import React, { FC, ReactElement } from 'react';
import { fc } from '@zextras/zapp-shell/fc';

import { setUpgradeFcn } from '@zextras/zapp-shell/idb';
import { addCreateMenuItem, addMainMenuItem, registerRoute } from '@zextras/zapp-shell/router';
import { MailOutlined } from '@material-ui/icons';
import { MailSyncService } from './sync/MailSyncService';
import { MailService } from './mail/MailService';
import MailComposeView from './ui/MailComposeView';
// import MailView from './ui/MailView';
import { schemaVersion, upgradeFn } from './idb/MailIdb';
import MailMainView, { ROUTE as MainRoute } from './ui/MailMainView';
import ComposerContextProvider from './composer/ComposerContextProvider';

const MailCompose = (): ReactElement => (
	<ComposerContextProvider>
		<MailComposeView />
	</ComposerContextProvider>
);

export default function app(): void {
	setUpgradeFcn(schemaVersion, upgradeFn);
	fc.subscribe(console.log);
	const syncSrvc = new MailSyncService();
	const mailSrvc = new MailService(syncSrvc);

	registerRoute(MainRoute, MailMainView, { mailSrvc });
	registerRoute('/mail/compose', MailCompose, {});
	// registerRoute('/mail/view/:id', MailView, {});

	addMainMenuItem(
		<MailOutlined />,
		'Mail',
		'/mail/folder/Inbox',
		mailSrvc.mainMenuChildren
	);

	addCreateMenuItem(
		<MailOutlined />,
		'New Mail',
		'/mail/compose'
	);
}
