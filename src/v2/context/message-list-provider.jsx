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

import React, { useCallback } from 'react';
import { keyBy } from 'lodash';
import { hooks } from '@zextras/zapp-shell';
import MessageListContext from './message-list-context';

function MessageListProvider({ children }) {
	const { db } = hooks.useAppContext();
	const query = useCallback(
		() => db.messages.toArray().then((m) => keyBy(m, '_id')),
		[db.messages]
	);
	const [messages, loaded] = hooks.useObserveDb(query, db);
	return (
		<MessageListContext.Provider
			value={[messages, loaded]}
		>
			{ children }
		</MessageListContext.Provider>
	)
}

export default MessageListProvider;
