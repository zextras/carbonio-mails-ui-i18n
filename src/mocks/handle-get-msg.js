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

import { generateMessage } from './generators';

function goodResponse(msg) {
	return {
		"Body": {
			"GetMsgResponse": {
				"m": [
					msg
				],
				"_jsns": "urn:zimbraMail"
			}
		},
		"_jsns": "urn:zimbraSoap"
	};
}

export function handleGetMsgRequest(req, res, ctx) {
	const { id } = req.body.Body.GetMsgRequest.m;
	switch (id) {
		default:
		case '1':
			return res(
				ctx.json(
					goodResponse(generateMessage({ messageId: id })),
				)
			);
	}
}