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

import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Text } from '@zextras/zapp-ui';

export const ROUTE = '/mails/folder/:path*';

export default function App() {
	const { path } = useParams();
	return (
		<Container width="fill" height="fill" background="bg_9" mainAlignment="flex-start" crossAlignment="flex-start">
			<Container width="50%" background="bg_7" padding={{ all: 'large' }} mainAlignment="flex-start" crossAlignment="flex-start">
				<Text size="large" color="txt_2">{`Mails: ${path}`}</Text>
			</Container>
		</Container>
	);
};
