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

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
	Container,
	List,
	Text,
	Responsive,
	useScreenMode
} from '@zextras/zapp-ui';
import MailList from './list/MailList';
import MailContextProvider from '../context/MailContextProvider';

export const ROUTE = '/mails/folder/:path*';


export default function App({ mailsSrvc }) {
	const { path } = useParams();
	return (
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
				</Responsive>
			</Container>
		</MailContextProvider>
	);
}


const SecondaryView = ({ mailsSrvc, view, edit }) => {
	const screenMode = useScreenMode();
	const panel = useMemo(() => {
		if (edit) {
			return <Text>Hello</Text>;
		}
		if (view) {
			return <Text>Hello</Text>;
		}
		if (screenMode === 'mobile') {
			return <Text>List!</Text>;
		}
		return <Text>Hello</Text>;
	}, [screenMode, edit, view, mailsSrvc]);
	return <>{ panel }</>;
};
