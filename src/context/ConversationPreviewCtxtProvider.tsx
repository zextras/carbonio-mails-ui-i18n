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

import React, { PropsWithChildren, useEffect, useState } from 'react';
import { map, find, orderBy } from 'lodash';
import ConversationPreviewCtxt from './ConversationPreviewCtxt';
import { IMailsService } from '../IMailsService';
import { fc } from '@zextras/zapp-shell/fc';
import { filter } from 'rxjs/operators';
import { _CONVERSATION_UPDATED_EV_REG, _MESSAGE_UPDATED_EV_REG } from '../MailsService';

type ConversationPreviewCtxtProviderProps = {
	convId: string;
	expandedMsg: Array<string>;
	mailService: IMailsService;
};

const ConversationPreviewCtxtProvider = ({
	convId,
	expandedMsg,
	mailService,
	children
}: PropsWithChildren<ConversationPreviewCtxtProviderProps>) => {
	const [conversation, setConversation] = useState(undefined);

	useEffect(() => {
		const updateConversation = () => {
			mailService.getConversation(convId)
				.then((conv) => {
					mailService.getMessages(map(conv.messages, (message) => message.id))
						.then((messagesMap) => {
							setConversation({
								...conv,
								messages: orderBy(
									map(
										messagesMap,
										(singleMessage) => ({...singleMessage, folder: "ciao"})
									),
									['date'],
									['desc'])
							});
						});
				});
		};

		const conversationSubscription = fc
			.pipe(filter((e) => _CONVERSATION_UPDATED_EV_REG.test(e.event)))
			.subscribe(({ data }) => data.id === convId && updateConversation());
		const messageSubscription = fc
			.pipe(filter((e) => _MESSAGE_UPDATED_EV_REG.test(e.event)))
			.subscribe(({ data }) => conversation && find(conversation.messages, ['id', data.id]) && updateConversation());

		updateConversation();

		return () => {
			conversationSubscription.unsubscribe();
			messageSubscription.unsubscribe();
		};
	}, [convId]);

	return (
		<ConversationPreviewCtxt.Provider
			value={{
				conversation
			}}
		>
			{ children }
		</ConversationPreviewCtxt.Provider>
	);
};

export default ConversationPreviewCtxtProvider;
