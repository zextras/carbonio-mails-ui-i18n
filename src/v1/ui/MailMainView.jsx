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
import { Redirect, useParams, useLocation } from 'react-router-dom';
import { Grid, Hidden } from '@material-ui/core';
import MailFolderListView from './folder/MailFolderListView';
import MailServicesContextProvider from '../context/MailServicesContextProvider';
import EmptyPanel from './folder/EmptyPanel';
import ConversationView from './conversation/MailConversationView';
import MailComposeView from './compose/MailComposeView';

export const ROUTE = '/mail/folder/:path*';

// A custom hook that builds on useLocation to parse
// the query string for you.
function useQuery() {
	return new URLSearchParams(useLocation().search);
}

const MailMainView = ({ mailSrvc, syncSrvc }) => {
	const { path } = useParams();
	const query = useQuery();
	const conv = query.get('conv');
	const comp = query.get('comp');
	const getSideView = () => {
		if (conv) {
			return (
				<ConversationView id={conv.split(',')[0]} />
			);
		}
		if (comp) {
			return (
				<MailComposeView id={comp.split(',')[0]} />
			);
		}
		return (<EmptyPanel path={path} />);
	};
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
						{getSideView()}
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
