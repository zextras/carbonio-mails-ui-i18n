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

import React, { useMemo, useEffect } from 'react';
import { Container } from '@zextras/zapp-ui';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import PreviewPanelHeader from './preview-panel-header';
import PreviewPanelActions from './preview-panel-actions';
import MailPreview from './mail-preview';
import { searchConv } from '../store/conversations-slice';
import useQueryParam from '../hooks/useQueryParam';

export default function ConversationPreviewPanel() {
	return null;
	const dispatch = useDispatch();
	const conversationId = useQueryParam('conversation');
	const { folderId } = useParams();

	const conversations = {};
	const conversation = conversations[conversationId];

	useEffect(() => {
		if (!conversation) {
			dispatch(searchConv({ conversationId }));
		}
	}, [conversationId]);

	const messages = useMemo(() => {
		if (conversation) {
			return conversation.messages.map((message, index) => (
				<MailPreview
					key={message.id}
					messageId={message.id}
					firstMail={index === 0}
				/>
			));
		}
		return [];
	}, [conversation]);

	return (
		<Container
			orientation="vertical"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
		>
			{ conversation && (
				<>
					<PreviewPanelHeader conversation={conversation} folderId={folderId} />
					<PreviewPanelActions conversation={conversation} folderId={folderId} />
					<Container
						style={{ overflowY: 'auto' }}
						height="fill"
						background="gray5"
						padding={{ horizontal: 'medium', bottom: 'small' }}
						mainAlignment="flex-start"
					>
						<Container
							height="fit"
							mainAlignment="flex-start"
							background="gray5"
						>
							{ messages }
						</Container>
					</Container>
				</>
			)}
		</Container>
	);
}
