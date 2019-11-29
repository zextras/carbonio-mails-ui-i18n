/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2019 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import { IMailServiceContext } from './IMailServiceContext';
import { createContext, Context } from 'react';

const context: Context<IMailServiceContext> = createContext<IMailServiceContext>({
	setCurrentFolder: (path: string) => undefined,
	currentBreadCrumbs: []
});
export default context;
