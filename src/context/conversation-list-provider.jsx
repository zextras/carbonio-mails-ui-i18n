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
import { filter, keyBy } from 'lodash';
import { hooks } from '@zextras/zapp-shell';
import ConversationListContext from './conversation-list-context';
import FolderListContext from './folder-list-context';

function ConversationListProvider({ children, folderId }) {
	const { db } = hooks.useAppContext();
	const [folders, folderLoaded] = useContext(FolderListContext);
	const id = useMemo(() => {
		if (folderLoaded) {
			return folders[folderId].id;
		}
		return null;
	}, [folderId, folderLoaded, folders]);
	const conversationsQuery = useCallback(
		() => db.conversations.toArray()
			.then((convs) => keyBy(
				filter(convs, (c) => folderLoaded ? c.parent.includes(id) : false),
				'_id'
			)),
		[db.conversations, folderLoaded, id]
	);
	const [conversations, loaded] = hooks.useObserveDb(conversationsQuery, db);
	return (
		<ConversationListContext.Provider
			value={[conversations, loaded]}
		>
			{ children }
		</ConversationListContext.Provider>
	);
}

export default ConversationListProvider;
