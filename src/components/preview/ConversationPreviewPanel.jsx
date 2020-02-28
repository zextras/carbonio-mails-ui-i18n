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

import React, { useState, useEffect, useContext } from 'react';
import {
	Container
} from '@zextras/zapp-ui';
import { map, find, filter } from 'lodash';
import { useHistory } from 'react-router';
import PreviewPanelHeader from './PreviewPanelHeader';
import MailPreview from './MailPreview';
import ConversationPreviewCtxt from '../../context/ConversationPreviewCtxt';

const toggleOpen = (id, open, history) => {
	const hash = history.location.hash.replace('#', '');
	history.replace({
		search: history.location.search,
		hash: open
			? filter(hash.split('.'), (hashId) => id !== hashId).join('.')
			: `${hash}${hash === '' ? '' : '.'}${id}`
	});
};

const ConversationPreviewPanel = ({ mailsSrvc, expandedMsgs }) => {
	const { conversation } = useContext(ConversationPreviewCtxt);
	const history = useHistory();

	const isOpen = (id) => !!find(expandedMsgs, (messageId) => id === messageId);

	return (
		<Container
			orientation="vertical"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
		>
			{ conversation && (
				<>
					<PreviewPanelHeader conversation={conversation} />
					<Container
						style={{ overflowY: 'auto' }}
						height="fill"
						background="bg_9"
						padding={{ horizontal: 'medium', bottom: 'small' }}
						mainAlignment="flex-start"
					>
						<Container
							height="fit"
							mainAlignment="flex-start"
							background="bg_7"
						>
							{
								map(
									conversation.messages,
									(mail) => (
										<MailPreview
											key={mail.id}
											open={isOpen(mail.id)}
											toggleOpen={() => toggleOpen(mail.id, isOpen(mail.id), history)}
											message={mail}
											onUnreadLoaded={() => mailsSrvc.markMessageAsRead(
												mail.id,
												!mail.read
											).then(() => {})}
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
};

export default ConversationPreviewPanel;
