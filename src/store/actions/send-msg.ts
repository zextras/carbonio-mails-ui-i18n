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
import { SaveDraftRequest, SaveDraftResponse } from '../../types/soap';
import { StateType } from '../../types/state';
import { generateRequest } from '../editor-slice-utils';
import { getConv } from './get-conv';
import { getMsg } from './get-msg';

export type SendMsgParameters = {
	editorId: string;
}

export const sendMsg = createAsyncThunk<any, SendMsgParameters>(
	'sendMsg',
	async ({ editorId }, { getState, dispatch }) => {
		const editor = (getState() as StateType).editors.editors[editorId];
		const resp = await network.soapFetch<SaveDraftRequest, SaveDraftResponse>(
			'SendMsg',
			{
				_jsns: 'urn:zimbraMail',
				m: generateRequest(editor)
			}
		);
		if (resp?.m[0]?.id) {
			dispatch(getMsg({ msgId: resp.m[0].id }));
		}
		if (resp?.m[0]?.cid) {
			dispatch(getConv({ conversationId: resp.m[0].cid }));
		}

		return { resp, editor };
	}
);
