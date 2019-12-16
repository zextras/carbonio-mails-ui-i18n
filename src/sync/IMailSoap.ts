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

import { IConvObj } from '../IMailSoap';

export type IMsgActionReqObj = {
	action: {
		op: 'read';
		id: string;
	};
};

export type ISearchReq = {
	query: string;
	recip?: 0|1|2;
	fullConversation?: 1|0;
	fetch?: 'all';
	neuter?: 1|0;
	wantContent?: 'full'|'original'|'both';
	types?: 'conversation'|'message'|'contact'|'appointment'|'task'|'wiki'|'document';
	limit?: number;
};

export type ISearchResp = {
	more: boolean;
	offset: number;
	sortBy: 'dateDesc';
	_jsns: 'urn:zimbraMail';
};

export type ISearchConvResp = ISearchResp & {
	c: Array<IConvObj>;
};
