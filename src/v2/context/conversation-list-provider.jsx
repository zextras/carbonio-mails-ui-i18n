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
import ConversationListContext from './conversation-list-context';

function ConversationListProvider({ children }) {
	const { db } = hooks.useAppContext();
	const query = useCallback(
		() => db.conversations.toArray().then((c) => keyBy(c, '_id')),
		[db.conversations]
	);
	const [conversations, loaded] = hooks.useObserveDb(query, db);
	return (
		<ConversationListContext.Provider
			value={[conversations, loaded]}
		>
			{ children }
		</ConversationListContext.Provider>
	)
}

export default ConversationListProvider;
