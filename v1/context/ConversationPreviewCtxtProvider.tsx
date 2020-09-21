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

import React, {
	ReactElement,
	PropsWithChildren,
	useEffect,
	useState,
	useContext,
	useRef
} from 'react';
import { find } from 'lodash';
import { filter } from 'rxjs/operators';
import { fc } from '@zextras/zapp-shell/fc';
import { syncOperations } from '@zextras/zapp-shell/sync';
import ConversationPreviewCtxt from './ConversationPreviewCtxt';
import { IMailsService } from '../../src/IMailsService';
import {
	_CONVERSATION_UPDATED_EV_REG,
	_CONVERSATION_DELETED_EV_REG,
	_MESSAGE_UPDATED_EV_REG
} from '../../src/MailsService';
import { ConversationWithMessages } from './ConversationFolderCtxt';
import { processOperationsConversation } from './ConversationUtility';
import activityContext from '../activity/ActivityContext';

type ConversationPreviewCtxtProviderProps = {
	convId: string;
	mailsSrvc: IMailsService;
};

const ConversationPreviewCtxtProvider = ({
	convId,
	mailsSrvc,
	children
}: PropsWithChildren<ConversationPreviewCtxtProviderProps>): ReactElement => {
	const [conversation, setConversation] = useState<ConversationWithMessages|undefined>(undefined);
	const { reset } = useContext(activityContext);
	const convRef = useRef<ConversationWithMessages|undefined>();

	function updateConversation(): void {
		(mailsSrvc.getConversation(convId, true) as Promise<ConversationWithMessages>)
			.then((conv: ConversationWithMessages) =>
				processOperationsConversation(syncOperations.getValue(), conv, mailsSrvc)
					.then(([convModified]) => setConversation(convModified)));
	}

	useEffect(() => {
		convRef.current = conversation;
	}, [conversation]);

	useEffect(() => updateConversation(), [convId]);

	useEffect(() => {
		let semaphore = true;
		const conversationUpdatedSubscription = fc
			.pipe(filter((e) => _CONVERSATION_UPDATED_EV_REG.test(e.event)))
			.subscribe(({ data }) => data.id === convId && updateConversation());

		const conversationDeletedSubscription = fc
			.pipe(filter((e) => _CONVERSATION_DELETED_EV_REG.test(e.event)))
			.subscribe(({ data }) => data.id === convId && reset('mailView'));

		const messageUpdatedSubscription = fc
			.pipe(filter((e) => _MESSAGE_UPDATED_EV_REG.test(e.event)))
			.subscribe(({ data }) => {
				if (convRef.current && find(convRef.current.messages, ['id', data.id])) {
					updateConversation();
				}
			});

		const operationSubscription = syncOperations.subscribe((operations) => {
			if (convRef.current) {
				processOperationsConversation(operations, convRef.current, mailsSrvc)
					.then(([convModified, modified]) => {
						if (semaphore && modified) {
							setConversation(convModified);
						}
					});
			}
		});

		return (): void => {
			semaphore = false;
			conversationUpdatedSubscription.unsubscribe();
			conversationDeletedSubscription.unsubscribe();
			messageUpdatedSubscription.unsubscribe();
			operationSubscription.unsubscribe();
		};
	}, [convId]);

	useEffect(() => updateConversation(), [convId]);

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
