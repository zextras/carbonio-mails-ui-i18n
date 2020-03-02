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
	IconButton,
	Icon,
	Padding,
	Divider
} from '@zextras/zapp-ui';
import activityContext from '../../activity/ActivityContext';

const PreviewPanelHeader = ({conversation}) => {
	const { reset } = useContext(activityContext);
	return (
		<>
			<Container
				orientation="horizontal"
				height="48px"
				background="bg_9"
				mainAlignment="space-between"
				crossAlignment="center"
				style={{minHeight: '48px'}}
			>
				<Container
					orientation="horizontal"
					mainAlignment="flex-start"
					padding={{ left: 'large' }}
					style={{ minWidth: '0'}}
				>
					<Icon
						size="large"
						icon="EmailOutline"
					/>
					<Padding left="medium">
						<Text
							size="large"
						>
							{conversation.subject}
						</Text>
					</Padding>
				</Container>
				<IconButton icon="Close" onClick={() => reset('mailView')} />
			</Container>
			<Divider />
		</>
	);
};

export default PreviewPanelHeader;
