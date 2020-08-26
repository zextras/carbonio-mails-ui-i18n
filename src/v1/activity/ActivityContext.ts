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
import IActivityContext from './IActivityContext';

const activityContext = createContext<IActivityContext>({
	get: (name) => ({ value: '', hash: '' }),
	set: (name, id) => console.log(`set ${name} to ${id}`),
	reset: (name) => console.log(`reset ${name}`),
	push: (name, id) => console.log(`push ${id} to ${name}`),
	pull: (name, id) => console.log(`pull ${id} from ${name}`),
});

export default activityContext;
