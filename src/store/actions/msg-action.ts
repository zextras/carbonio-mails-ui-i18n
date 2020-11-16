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
import { MsgActionRequest, MsgActionResponse, MsgActionOperation } from '../../types/soap';

export type MsgActionParameters = {
	ids: string[];
	operation: MsgActionOperation;
	parent?: string;
}

export type MsgActionResult = {
	ids: string[];
	operation: MsgActionOperation;
}

export const msgAction = createAsyncThunk<MsgActionResult, MsgActionParameters>(
	'msgAction',
	async ({ ids, operation, parent }) => {
		const { action } = await network.soapFetch<MsgActionRequest, MsgActionResponse>(
			'MsgAction',
			{
				_jsns: 'urn:zimbraMail',
				action: {
					id: ids.join(','),
					op: operation,
					l: parent,
				},
			},
		);
		return {
			ids: action.id.split(','),
			operation: action.op,
		};
	},
);
