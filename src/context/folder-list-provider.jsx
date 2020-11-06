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
import { useSelector } from 'react-redux';
import FolderListContext from './folder-list-context';
import { selectFolders } from '../store/folders-slice';

function FolderListProvider({ children }) {
	const allFolders = useSelector(selectFolders);

	return (
		<FolderListContext.Provider
			value={[allFolders, true]}
		>
			{ children }
		</FolderListContext.Provider>
	);
}

export default FolderListProvider;
