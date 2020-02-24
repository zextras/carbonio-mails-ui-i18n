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

import React, { useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
	Container,
	Text,
	Responsive,
	useScreenMode
} from '@zextras/zapp-ui';
import MailList from './list/MailList';
import MailContextProvider from '../context/MailContextProvider';
import activityContext from '../activity/ActivityContext';
import ActivityContextProvider from '../activity/ActivityContextProvider';
import ConversationPreviewPanel from './preview/ConversationPreviewPanel';

export const ROUTE = '/mails/folder/:path*';

export default function App({ mailsSrvc }) {
	const { path } = useParams();
	return (
		<ActivityContextProvider>
			<MailContextProvider mailsSrvc={mailsSrvc} path={path}>
				<Container
					orientation="horizontal"
					width="fill"
					height="fill"
					mainAlignment="flex-start"
					crossAlignment="flex-start"
				>
					<Responsive mode="desktop">
						<Container
							orientation="vertical"
							width="50%"
							height="fill"
							mainAlignment="flex-start"
						>
							<MailList />
						</Container>
						<Container
							orientation="vertical"
							width="50%"
							height="fill"
							mainAlignment="flex-start"
						>
							<SecondaryView mailsSrvc={mailsSrvc} />
						</Container>
					</Responsive>
				</Container>
			</MailContextProvider>
		</ActivityContextProvider>
	);
}


const SecondaryView = ({ mailsSrvc }) => {
	const { get } = useContext(activityContext);
	const screenMode = useScreenMode();
	const panel = useMemo(() => {
		if (get('mailEditor')) {
			return <Text>Hello</Text>;
		}
		if (get('mailView')) {
			return (
				<ConversationPreviewPanel key="preview" id={get('mailView')} mailsSrvc={mailsSrvc} />
			);
		}
		if (screenMode === 'mobile') {
			return <Text>List!</Text>;
		}
		return <Text>Hello</Text>;
	}, [screenMode, get, mailsSrvc]);
	return <>{ panel }</>;
};
