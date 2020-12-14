/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import { combineReducers } from '@reduxjs/toolkit';
import { folderSliceReducer } from './folders-slice';
import { syncSliceReducer } from './sync-slice';
import { conversationsSliceReducer } from './conversations-slice';
import { messageSliceReducer } from './messages-slice';
import { editorSliceRecucer } from './editor-slice';

export default combineReducers({
	folders: folderSliceReducer,
	sync: syncSliceReducer,
	conversations: conversationsSliceReducer,
	messages: messageSliceReducer,
	editors: editorSliceRecucer,
});
