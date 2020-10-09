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
	useCallback, useEffect, useState
} from 'react';
import { keyBy } from 'lodash';
import { hooks } from '@zextras/zapp-shell';
import ConversationListContext from './conversation-list-context';
import { report } from '../commons/report-exception';

function ConversationListProvider({ children }) {
	const { db } = hooks.useAppContext();
	const conversationsQuery = useCallback(
		() => db.conversations.toArray()
			.then((convs) => keyBy(
				convs,
				'_id'
			)).catch(report),
		[db.conversations]
	);

	const [conversationsFromDB, conversationsLoaded] = hooks.useObserveDb(conversationsQuery, db);

	const [loaded, setLoaded] = useState(false);
	const [conversations, setConversations] = useState({});

	useEffect(() => {
		if (conversationsLoaded && !loaded) setLoaded(true);
	}, [conversationsLoaded, loaded]);
	useEffect(() => {
		if (conversationsFromDB && conversationsLoaded) setConversations(conversationsFromDB);
	}, [conversationsLoaded, conversationsFromDB]);

	return (
		<ConversationListContext.Provider
			value={[conversations, loaded]}
		>
			{ children }
		</ConversationListContext.Provider>
	);
}

export default ConversationListProvider;
