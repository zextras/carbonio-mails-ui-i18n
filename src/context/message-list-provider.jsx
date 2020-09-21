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

import React, { useCallback, useContext, useMemo } from 'react';
import { filter, keyBy, find } from 'lodash';
import { hooks } from '@zextras/zapp-shell';
import MessageListContext from './message-list-context';
import ConversationListContext from './conversation-list-context';

function MessageListProvider({ children }) {
	const { db } = hooks.useAppContext();
	const [conversations, convsLoaded] = useContext(ConversationListContext);
	const messagesQuery = useCallback(
		() => db.messages.toArray()
			.then((mess) => keyBy(
				filter(mess, (m) => convsLoaded ? find(conversations, ['id', m.conversation]) : false),
				'_id'
			)),
		[conversations, convsLoaded, db.messages]
	);
	const [messages, loaded] = hooks.useObserveDb(messagesQuery, db);
	return (
		<MessageListContext.Provider
			value={[messages, loaded]}
		>
			{ children }
		</MessageListContext.Provider>
	);
}

export default MessageListProvider;
