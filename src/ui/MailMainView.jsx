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
import { Redirect, useParams } from 'react-router-dom';
import { Grid, Hidden } from '@material-ui/core';
import MailFolderListView from './folder/MailFolderListView';
import MailServicesContextProvider from '../context/MailServicesContextProvider';
import EmptyPanel from './folder/EmptyPanel';

export const ROUTE = '/mail/folder/:path*';

const MailMainView = ({ mailSrvc, syncSrvc }) => {
	const { path } = useParams();

	if (path) {
		return (
			<MailServicesContextProvider
				mailSrvc={mailSrvc}
				syncSrvc={syncSrvc}
			>
				<Grid container>
					<MailFolderListView
						path={path}
					/>
					<Hidden smDown>
						<EmptyPanel path={path} />
					</Hidden>
				</Grid>
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
