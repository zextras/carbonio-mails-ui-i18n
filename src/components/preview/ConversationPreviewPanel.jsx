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

import React, { useState, useEffect } from 'react';
import {
	Container
} from '@zextras/zapp-ui';
import { map, orderBy } from 'lodash';
import PreviewPanelHeader from './PreviewPanelHeader';
import MailPreview from './MailPreview';

const ConversationPreviewPanel = ({ id, mailsSrvc }) => {
	const [conversation, setConversation] = useState({});
	const [mails, setMails] = useState([]);
	const [current, setCurrent] = useState('');
	useEffect(() => {
		mailsSrvc.getConversation(id).then(
			(conv) => {
				mailsSrvc.getMessages(map(conv.messages, (message) => message.id)).then(
					(messages) => {
						setMails(orderBy(Object.values(messages), ['date'], ['desc']));
						setConversation(conv);
					}
				);
			}
		);
	}, [id]);
	useEffect(() => current === '' && mails[0] && setCurrent(mails[0].id), [mails]);

	return (
		<Container
			orientation="vertical"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
		>
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
							mails,
							(mail) => (
								<MailPreview
									key={mail.id}
									open={mail.id === current}
									setCurrent={setCurrent}
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
		</Container>
	);
};

export default ConversationPreviewPanel;
