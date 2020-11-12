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

import { SoapMailMessage } from './soap-mail-message';
import { ZimbraRequest } from './zimbra-request';

// https://files.zimbra.com/docs/ soap_api/9.0.0/api-reference/zimbraMail/SearchConv.html

export type SearchConvRequest = ZimbraRequest & {
	offset: number;
	sortBy: string;
	limit: number;
	query: string;
	cid: string;
	fetch: string;
	html: 1 | 0;
	needExp: 1 | 0;
	max: number;
	recip: '0' | '1' | '2' | 'false' | 'true';
}

export type SearchConvResponse = {
	more: boolean;
	offset: string;
	m: Array<SoapMailMessage>;
	orderBy: string;
}
