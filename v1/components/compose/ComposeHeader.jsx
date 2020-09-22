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
	Icon,
	IconButton,
	Text,
	Padding
} from '@zextras/zapp-ui';
import activityContext from '../../activity/ActivityContext';

function ComposeHeader({}) {
	const { reset } = useContext(activityContext);
	return (
		<Container
			height="fit"
			background="bg_9"
			padding={{ horizontal: 'small' }}
		>
			<Container
				orientation="horizontal"
				height="48px"
				style={{ minHeight: '48px' }}
				mainAlignment="space-between"
				padding={{ horizontal: 'large' }}
			>
				<Container
					orientation="horizontal"
					width="fill"
					style={{ minWidth: '0' }}
					mainAlignment="flex-start"
				>
					<Padding right="medium">
						<Icon
							icon="EditOutline"
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
		</Container>
	);
}

export default ComposeHeader;
