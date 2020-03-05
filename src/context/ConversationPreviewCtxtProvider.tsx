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
import { find } from 'lodash';
import { filter } from 'rxjs/operators';
import { fc } from '@zextras/zapp-shell/fc';
import { syncOperations } from '@zextras/zapp-shell/sync';
import ConversationPreviewCtxt from './ConversationPreviewCtxt';
import { IMailsService } from '../IMailsService';
import { _CONVERSATION_UPDATED_EV_REG, _MESSAGE_UPDATED_EV_REG } from '../MailsService';
import { ConversationWithMessages } from './ConversationFolderCtxt';
import { processOperationsConversation } from './ConversationUtility';

type ConversationPreviewCtxtProviderProps = {
	convId: string;
	mailsSrvc: IMailsService;
};

const ConversationPreviewCtxtProvider = ({
	convId,
	mailsSrvc,
	children
}: PropsWithChildren<ConversationPreviewCtxtProviderProps>) => {
	const [conversation, setConversation] = useState<ConversationWithMessages|undefined>(undefined);

	useEffect(() => {
		const updateConversation = () => {
			(mailsSrvc.getConversation(convId, true) as Promise<ConversationWithMessages>)
				.then((conv: ConversationWithMessages) => setConversation(
					processOperationsConversation(syncOperations.getValue(), conv)[0]
				));
		};

		const conversationSubscription = fc
			.pipe(filter((e) => _CONVERSATION_UPDATED_EV_REG.test(e.event)))
			.subscribe(({ data }) => data.id === convId && updateConversation());

		const messageSubscription = fc
			.pipe(filter((e) => _MESSAGE_UPDATED_EV_REG.test(e.event)))
			.subscribe(({ data }) => {
				if (conversation) {
					find(conversation.messages, ['id', data.id]) && updateConversation();
				}
			});

		const operationSubscription = syncOperations.subscribe((operations) => {
			if (conversation) {
				const [convModified, modified] = processOperationsConversation(operations, conversation);
				if (modified) {
					setConversation(convModified);
				}
			}
		});

		updateConversation();

		return () => {
			conversationSubscription.unsubscribe();
			messageSubscription.unsubscribe();
			operationSubscription.unsubscribe();
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
