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

import React, { PropsWithChildren, useState } from 'react';
import ConversationFolderCtxt from './ConversationFolderCtxt';

type ConversationFolderCtxtProviderProps = {
	folderPath: string;
};

const ConversationFolderCtxtProvider = ({ folderPath, children }: PropsWithChildren<ConversationFolderCtxtProviderProps>) => {
	const [convList, setConvList] = useState([]);
	const [convMap, setConvMap] = useState({});

	return (
		<ConversationFolderCtxt.Provider
			value={{
				convList: convList,
				convMap: convMap
			}}
		>
			{ children }
		</ConversationFolderCtxt.Provider>
	);
};

export default ConversationFolderCtxtProvider;
