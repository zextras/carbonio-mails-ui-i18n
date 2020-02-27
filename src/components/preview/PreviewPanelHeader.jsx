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
import React, { useContext } from 'react';
import {
	Container,
	Text,
	IconButton
} from '@zextras/zapp-ui';
import activityContext from '../../activity/ActivityContext';

const PreviewPanelHeader = ({conversation}) => {
	const { reset } = useContext(activityContext);
	return (
		<Container
			orientation="horizontal"
			height="48px"
			background="bg_9"
			mainAlignment="flex-start"
			style={{minHeight: '48px'}}
		>
			<IconButton icon="Close" onClick={() => reset('mailView')} />
			<Text
				size="large"
			>
				{conversation.subject}
			</Text>
		</Container>
	);
};

export default PreviewPanelHeader;
