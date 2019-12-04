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

import React, { FC } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { IMailService } from '../mail/IMailService';
import MailFolderListView from './MailFolderListView';
import { IMailSyncService } from '../sync/IMailSyncService';
import MailServicesContextProvider from '../context/MailServicesContextProvider';

export const ROUTE = '/mail/folder/:path*';

interface IMailListViewProps {
	mailSrvc: IMailService;
	syncSrvc: IMailSyncService;
}

const MailMainView: FC<IMailListViewProps> = ({ mailSrvc, syncSrvc }) => {
	const { path } = useParams<{ path: string }>();

	if (path) {
		return (
			<MailServicesContextProvider
				mailSrvc={mailSrvc}
				syncSrvc={syncSrvc}
			>
				<MailFolderListView
					path={path}
				/>
			</MailServicesContextProvider>
		);
	}
	return (
		<Redirect
			to="/mail/folder/Inbox"
		/>
	);
};
export default MailMainView;
