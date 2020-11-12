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

import { createAsyncThunk } from '@reduxjs/toolkit';
import { network } from '@zextras/zapp-shell';
import { normalizeMailMessageFromSoap } from '../../commons/normalize-message';
import { MailMessage } from '../../types/mail-message';
import { GetMsgRequest, GetMsgResponse } from '../../types/soap';

export type GetMsgParameters = {
	msgId: string;
}

export const getMsg = createAsyncThunk<MailMessage, GetMsgParameters>(
	'messages/getMsg',
	async ({ msgId }, { getState }: any) => {
		const result = await network.soapFetch<GetMsgRequest, GetMsgResponse>(
			'GetMsg',
			{
				_jsns: 'urn:zimbraMail',
				m: {
					html: 1,
					id: msgId,
					needExp: 1,
				}
			},
		);
		const msg = result.m[0];
		return normalizeMailMessageFromSoap(msg);
	},
	{
		condition: ({ msgId }, { getState }: any) => !(msgId in getState().messages.cache),
	}
);
