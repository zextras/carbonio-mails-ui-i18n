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
import FolderListContext from './folder-list-context';

function FolderListProvider({ children }) {
	const { db } = hooks.useAppContext();
	const query = useCallback(
		() => db.folders.toArray().then((c) => keyBy(c, '_id')),
		[db.folders]
	);
	const [folders, loaded] = hooks.useObserveDb(query, db);
	return (
		<FolderListContext.Provider
			value={[folders, loaded]}
		>
			{ children }
		</FolderListContext.Provider>
	);
}

export default FolderListProvider;
