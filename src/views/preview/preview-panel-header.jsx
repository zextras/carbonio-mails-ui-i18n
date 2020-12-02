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
import { useTranslation } from 'react-i18next';
import { hooks } from '@zextras/zapp-shell';
import { Container, Divider, Icon, IconButton, Row, Text } from '@zextras/zapp-ui';

function PreviewPanelHeader({ conversation, folderId }) {
	const [ t ] = useTranslation();
	const replaceHistory = hooks.useReplaceHistoryCallback();
	return (
		<>
			<Container
				orientation="horizontal"
				height="48px"
				background="gray5"
				mainAlignment="space-between"
				crossAlignment="center"
				padding={{ left: 'large', right: 'extrasmall' }}
				style={{ minHeight: '48px' }}
			>
				{conversation.read
					? <Icon size="large" icon="EmailReadOutline" data-testid="EmailReadIcon" />
					: <Icon size="large" icon="EmailReadOutline" data-testid="EmailUnreadIcon" />
				}
				<Row
					mainAlignment="flex-start"
					padding={{ left: 'large' }}
					takeAvailableSpace
				>
					<Text size="large">{ conversation.subject || `(${t('header.no_subject')})` }</Text>
				</Row>
				<IconButton data-testid="PreviewPanelCloseIcon" icon="Close" onClick={() => replaceHistory(`/folder/${folderId}`)} />
			</Container>
			<Divider />
		</>
	);
}

export default PreviewPanelHeader;
