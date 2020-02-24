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
	Container,
	Text
} from '@zextras/zapp-ui';
import { map } from 'lodash';

const ConversationPreviewPanel = ({ id, mailsSrvc }) => {
	const [conversation, setConversation] = useState({});
	const [mails, setMails] = useState({});
	useEffect(() => {
		mailsSrvc.getConversation(id).then(
			conv => {
				mailsSrvc.getMessages(map(conv.messages, message => message.id)).then(
					messages => {
						setMails(messages);
						setConversation(conv);
					}
				);
			}
		)
	}, [id, mailsSrvc]);
	console.log(mails);
	return (
		<Container
			orientation="vertical"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
		>
			<Text>hell</Text>
		</Container>
	);
};

export default ConversationPreviewPanel;
