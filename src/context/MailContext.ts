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

import { createContext } from 'react';
import IMailContext from './IMailContext';

const mailContext = createContext<IMailContext>({
	conversations: [],
	mails: {},
	view: [],
	edit: [],
	openView: (id) => console.log(`Open view for ${id}`),
	openEdit: (id) => console.log(`Open editor for ${id}`),
	closeView: (id) => console.log(`Close view for ${id}`),
	closeEdit: (id) => console.log(`Close editor for ${id}`)
});

export default mailContext;
