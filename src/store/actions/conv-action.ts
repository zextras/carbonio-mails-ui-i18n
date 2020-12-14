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
import { ConvActionOperation, ConvActionRequest, ConvActionResponse } from '../../types/soap';

export type ConvActionParameters = {
	ids: string[];
	operation: ConvActionOperation;
	parent?: string;
}

export type ConvActionResult = {
	ids: string[];
	operation: ConvActionOperation;
}

export const convAction = createAsyncThunk<ConvActionResult, ConvActionParameters
	>(
		'convAction',
		async ({ ids, operation, parent }) => {
			const { action } = await network.soapFetch<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
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
