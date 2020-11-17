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

import { SoapConversation } from './soap-conversation';
import { ZimbraRequest } from './zimbra-request';

export type GetConvRequest = ZimbraRequest & {
	c: {
		id: string;
		fetch?: string;
		html?: 0 | 1;
		max?: number;
		needExp: 0 | 1;
	};
}

export type GetConvResponse = {
	c: Array<SoapConversation>;
}
