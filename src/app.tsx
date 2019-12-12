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
import MailComposeView from './ui/compose/MailComposeView';
import ConversationView from './ui/conversation/MailConversationView';
import { schemaVersion, upgradeFn } from './idb/MailIdb';
import MailMainView, { ROUTE as MainRoute } from './ui/MailMainView';
import ComposerContextProvider from './composer/ComposerContextProvider';
import { IMailSyncService } from './sync/IMailSyncService';
import { registerTranslations } from './i18n/i18n';

export default function app(): void {
	registerTranslations();
	setUpgradeFcn(schemaVersion, upgradeFn);
	fc.subscribe(console.log);
	const syncSrvc: IMailSyncService = new MailSyncService();
	const mailSrvc = new MailService(syncSrvc);

	registerRoute(MainRoute, MailMainView, { mailSrvc, syncSrvc });
	registerRoute('/mail/compose/:id?', MailComposeView, { mailSrvc, syncSrvc });
	registerRoute('/mail/view/:id', ConversationView, { syncSrvc, mailSrvc });

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
