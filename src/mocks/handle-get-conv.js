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
import { generateConversation, generateMessage } from './generators';

function goodResponse(conv) {
	return {
		"Body": {
			"GetConvResponse": {
				"c": [
					conv
				],
				"_jsns": "urn:zimbraMail"
			}
		},
		"_jsns": "urn:zimbraSoap"
	};
}

export function handleGetConvRequest(req, res, ctx) {
	const { id } = req.body.Body.GetConvRequest.c;

	const conv = generateConversation({ conversationId: id });
	switch (id) {
		case '1':
			return res(
				ctx.json( goodResponse(generateConversation({ conversationId: '1' })))
			);
		default:
			return res(
				ctx.json( goodResponse(conv))
			);
	}
}