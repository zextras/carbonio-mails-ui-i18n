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
import { Link, useParams } from 'react-router-dom';
import {
	Container,
	Text,
	Responsive,
	useScreenMode,
	Catcher
} from '@zextras/zapp-ui';
import { map } from 'lodash';
import activityContext from '../activity/ActivityContext';
import ConversationPreviewPanel from './preview/ConversationPreviewPanel';
import ConversationFolderCtxt from '../context/ConversationFolderCtxt';
import ConversationPreviewCtxtProvider from '../context/ConversationPreviewCtxtProvider';
import ConversationFolderCtxtProvider from '../context/ConversationFolderCtxtProvider';
import ActivityContextProvider from '../activity/ActivityContextProvider';

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
							<Test />
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

const Test = () => {
	const { convList } = useContext(ConversationFolderCtxt);
	return (
		<div>
			<ol>
				{ map(
					convList,
					(v, k) => (<li key={v}><Link to="/mails/folder/Inbox?mailView=260#262">{v}</Link></li>)
				) }
			</ol>
		</div>
	);
};


const SecondaryView = ({ mailsSrvc, path }) => {
	const { get } = useContext(activityContext);
	const screenMode = useScreenMode();
	const panel = useMemo(() => {
		if (get('mailEditor').value) {
			return <Text>Hello</Text>;
		}
		if (get('mailView').value) {
			return (
				<ConversationPreviewCtxtProvider key="preview-provider" convId={get('mailView').value} mailsSrvc={mailsSrvc}>
					<ConversationPreviewPanel key="preview" id={get('mailView').value} mailsSrvc={mailsSrvc} />
				</ConversationPreviewCtxtProvider>
			);
		}
		if (screenMode === 'mobile') {
			return (
				<ConversationFolderCtxtProvider
					mailsSrvc={mailsSrvc}
					folderPath={`/${path}`}
				>
					<Test />
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
