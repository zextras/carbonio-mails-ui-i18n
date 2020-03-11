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
import activityContext from '../activity/ActivityContext';
import MailList from './list/MailList';
import ConversationPreviewPanel from './preview/ConversationPreviewPanel';
import ConversationPreviewCtxtProvider from '../context/ConversationPreviewCtxtProvider';
import ConversationFolderCtxtProvider from '../context/ConversationFolderCtxtProvider';
import ActivityContextProvider from '../activity/ActivityContextProvider';
import MailComposePanel from './compose/MailComposePanel';

export const ROUTE = '/mails/folder/:path*';

export default function App({ mailsSrvc }) {
	const { path } = useParams();
	return (
		<ActivityContextProvider>
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
							mailsSrvc={mailsSrvc}
							folderPath={`/${path}`}
						>
							<MailList mailsSrvc={mailsSrvc} path={`/${path}`} />
						</ConversationFolderCtxtProvider>
					</Container>
					<Container
						orientation="vertical"
						width="50%"
						height="fill"
						mainAlignment="flex-start"
					>
						<Catcher>
							<SecondaryView mailsSrvc={mailsSrvc} path={path} />
						</Catcher>
					</Container>
				</Responsive>
				<Responsive mode="mobile">
					<Catcher>
						<SecondaryView mailsSrvc={mailsSrvc} path={path} />
					</Catcher>
				</Responsive>
			</Container>
		</ActivityContextProvider>
	);
}

const SecondaryView = ({ mailsSrvc, path }) => {
	const { activities } = useContext(activityContext);
	const screenMode = useScreenMode();
	const panel = useMemo(() => {
		// if (activities['mailEdit']) {
			return <MailComposePanel />;
		// }
		if (activities['mailView']) {
			return (
				<ConversationPreviewCtxtProvider
					key="preview-provider"
					convId={activities['mailView']}
					mailsSrvc={mailsSrvc}
				>
					<ConversationPreviewPanel
						openMsg={activities['mailViewMsgId']}
						mailsSrvc={mailsSrvc}
						path={path}
					/>
				</ConversationPreviewCtxtProvider>
			);
		}
		if (screenMode === 'mobile') {
			return (
				<ConversationFolderCtxtProvider
					mailsSrvc={mailsSrvc}
					folderPath={`/${path}`}
				>
					<MailList mailsSrvc={mailsSrvc} path={`/${path}`} />
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
	}, [screenMode, activities, mailsSrvc, path]);
	return <>{ panel }</>;
};
