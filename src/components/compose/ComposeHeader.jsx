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
import { Container, Icon, IconButton, Text, Padding, Divider } from '@zextras/zapp-ui';
import activityContext from '../../activity/ActivityContext';

const ComposeHeader = ({}) => {
	const { reset } = useContext(activityContext);
	return (
		<Container
			height="fit"
		>
			<Container
				orientation="horizontal"
				height="48px"
				style={{ minHeight: '48px' }}
				background="bg_9"
				mainAlignment="space-between"
			>
				<Container
					orientation="horizontal"
					width="fill"
					style={{ minWidth: '0' }}
					mainAlignment="flex-start"
				>
					<Padding horizontal="medium">
						<Icon
							icon="Edit2Outline"
							label="Edit"
							size="large"
						/>
					</Padding>
					<Text size="large">Compose</Text>
				</Container>
				<IconButton
					icon="Close"
					onClick={() => reset('mailEdit')}
				/>
			</Container>
			<Divider />
		</Container>
	);
};

export default ComposeHeader;
