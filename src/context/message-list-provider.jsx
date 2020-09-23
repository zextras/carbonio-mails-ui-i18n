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

import React, { useCallback, useEffect, useState } from 'react';
import { keyBy } from 'lodash';
import { hooks } from '@zextras/zapp-shell';
import MessageListContext from './message-list-context';

function MessageListProvider({ children }) {
	const { db } = hooks.useAppContext();
	const messagesQuery = useCallback(
		() => db.messages.toArray()
			.then((mess) => keyBy(mess, '_id')),
		[db.messages]
	);
	const [messagesFromDB, messagesLoaded] = hooks.useObserveDb(messagesQuery, db);
	const [loaded, setLoaded] = useState(false);
	const [messages, setMessages] = useState({});
	useEffect(() => {
		if (messagesLoaded && !loaded) setLoaded(true);
	}, [messagesLoaded, loaded]);
	useEffect(() => {
		if (messagesFromDB && messagesLoaded) setMessages(messagesFromDB);
	}, [messagesLoaded, messagesFromDB]);

	return (
		<MessageListContext.Provider
			value={[messages, loaded]}
		>
			{ children }
		</MessageListContext.Provider>
	);
}

export default MessageListProvider;
