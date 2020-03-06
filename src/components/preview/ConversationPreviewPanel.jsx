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

import React, { useReducer, useContext, useEffect } from 'react';
import {
	Container
} from '@zextras/zapp-ui';
import { map, find, filter, concat } from 'lodash';
import PreviewPanelHeader from './PreviewPanelHeader';
import MailPreview from './MailPreview';
import ConversationPreviewCtxt from '../../context/ConversationPreviewCtxt';
import activityContext from '../../activity/ActivityContext';

const reducer = (state, { type, id }) => {
	switch (type) {
		case 'set': return [id];
		case 'open': return concat(state, id);
		case 'close': return filter(state, (item) => item !== id) || [];
		default: return state;
	}
};

const ConversationPreviewPanel = ({ mailsSrvc, openMsg, path }) => {
	const { conversation } = useContext(ConversationPreviewCtxt);
	const [ expandedMsgs, dispatch ] = useReducer(reducer, [openMsg]);
	const isOpen = (id) => !!find(expandedMsgs, (messageId) => id === messageId);
	useEffect(() => {
		dispatch({ type: 'set', id: openMsg });
	}, [openMsg]);
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
											path={path}
											key={mail.id}
											open={isOpen(mail.id)}
											toggleOpen={
												() => dispatch({
													type: isOpen(mail.id) ? 'close' : 'open',
													id: mail.id
												})
											}
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
