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
import { map } from 'lodash';
import PreviewPanelHeader from './preview-panel-header';
import PreviewPanelActions from './preview-panel-actions';
import MailPreview from './mail-preview';
import { selectConversationMap, selectCurrentFolderExpandedStatus } from '../store/conversations-slice';
import { useQueryParam } from '../hooks/useQueryParam';
import { getConv } from '../store/actions';

export default function ConversationPreviewPanel() {
	const conversationId = useQueryParam('conversation');
	const messageId = useQueryParam('message');
	const { folderId } = useParams();

	const dispatch = useDispatch();

	const conversations = useSelector(selectConversationMap);
	const conversation = conversations[conversationId];
	const conversationStatus = useSelector(selectCurrentFolderExpandedStatus)[conversationId];
	// conversation will be undefined if fake id wil be passed

	const fetch =	messageId || '1';
	// expand the most recent one

	useEffect(() => {
		dispatch(getConv({ conversationId, fetch, folderId }));
	}, [conversationId]);

	const messages = useMemo(() => {
		if (conversationStatus === 'complete') {
			return map(conversation.messages, (message, index) => (
				<MailPreview
					key={`${message.id}-${messageId}`}
					message={message}
					expanded={messageId ? messageId === message.id : index === 0}
				/>
			));
		}
		return [];
	}, [conversation, messageId]);

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
