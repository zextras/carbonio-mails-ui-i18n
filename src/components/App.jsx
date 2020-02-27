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
	useScreenMode,
	Catcher
} from '@zextras/zapp-ui';
import MailList from './list/MailList';
import MailContextProvider from '../context/MailContextProvider';
import activityContext from '../activity/ActivityContext';
import ActivityContextProvider from '../activity/ActivityContextProvider';
import ConversationPreviewPanel from './preview/ConversationPreviewPanel';
import ConversationFolderCtxtProvider from '../context/ConversationCtxtProvider';

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
							<ConversationFolderCtxtProvider
								folderPath={path}
							>
								{ /* <Catcher><MailList /></Catcher> */ }
							</ConversationFolderCtxtProvider>
						</Container>
						<Container
							orientation="vertical"
							width="50%"
							height="fill"
							mainAlignment="flex-start"
						>
							<Catcher><SecondaryView mailsSrvc={mailsSrvc} path={path} /></Catcher>
						</Container>
					</Responsive>
					<Responsive mode="mobile">
						<Catcher>
							<SecondaryView mailsSrvc={mailsSrvc} path={path} />
						</Catcher>
					</Responsive>
				</Container>
			</MailContextProvider>
		</ActivityContextProvider>
	);
}


const SecondaryView = ({ mailsSrvc, path }) => {
	const { get } = useContext(activityContext);
	const screenMode = useScreenMode();
	const panel = useMemo(() => {
		if (get('mailEditor').value) {
			return <Text>Hello</Text>;
		}
		if (get('mailView').value) {
			return (
				<ConversationPreviewPanel key="preview" id={get('mailView').value} mailsSrvc={mailsSrvc} />
			);
		}
		if (screenMode === 'mobile') {
			return (
				<ConversationFolderCtxtProvider
					folderPath={path}
				>
					{ /* <MailList /> */ }
				</ConversationFolderCtxtProvider>
			);
		}
		return (
			<Container
				width="fill"
				height="fill"
				background="bg_9"
			/>
		);
	}, [screenMode, get, mailsSrvc]);
	return <>{ panel }</>;
};
