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
import { map } from 'lodash';
import { Container } from '@zextras/zapp-ui';
import PreviewPanelHeader from './preview-panel-header';
import PreviewPanelActions from './preview-panel-actions';
import { useConversation } from '../hooks';
import MailPreview from './mail-preview';

export default function ConversationPreviewPanel({ conversationInternalId, folderId }) {
	const [
		conversation,
		conversationLoaded
	] = useConversation(conversationInternalId);
	return (
		<Container
			orientation="vertical"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
		>
			{ conversation && conversationLoaded && (
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
							{
								map(
									conversation.messages,
									(message, index) => (
										<MailPreview
											key={message.id}
											message={message}
											firstMail={index === 0}
										/>
									)
								)
							}
						</Container>
					</Container>
				</>
			)}
		</Container>
	);
}
