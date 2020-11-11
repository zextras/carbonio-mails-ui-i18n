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

export interface SearchRequest {
	_jsns: 'urn:zimbraMail';
	sortBy?: 'dateDesc';
	types: 'conversation';
	fullConversation: 0|1;
	needExp: 0|1;
	recip: 0|1;
	limit: number;
	query: string;
	fetch: 'all';
	wantContent?: string;
}

export interface SearchResponse {
	c: SoapConversation[];
	more: boolean;
}
