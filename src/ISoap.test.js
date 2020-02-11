/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import { forEach } from 'lodash';
import { normalizeMailMessageFromSoap } from './ISoap';

const tests = [
	{
		input: {
			cid: "1130",
			d: 1574335965000,
			e: [
				{
					a: "admin@70c49c70.testarea.zextras.com",
					d: "admin",
					t: "f",
				},
				{
					a: "user@70c49c70.testarea.zextras.com",
					d: "User",
					p: "User mcUserface",
					t: "t"
				}
			],
			f: "ufa",
			fr: "Hello user!",
			id: "1128",
			l: "2",
			mid: "<2140463174.1428.1574335965413.JavaMail.zimbra@70c49c70.testarea.zextras.com>",
			mp: [
				{
					ct: "multipart/alternative",
					mp: [
						{
							body: true,
							content: "Hello user!",
							ct: "text/plain",
							part: "1",
							s: 14,
						},
						{
							ct: "text/html",
							part: "2",
							s: 142,
						}
					],
					part: "TEXT"
				}
			],
			rev: 3803,
			s: 1448,
			sd: 1574335965000,
			su: "Hello user",
		},
		result: {
			bodyPath: "parts[0].parts[0]",
			contacts: [
				{
					address: "admin@70c49c70.testarea.zextras.com",
					displayName: "admin",
					type: "f"
				},
				{
					address: "user@70c49c70.testarea.zextras.com",
					displayName: "User",
					type: "t"
				}
			],
			conversation: "1130",
			date: 1574335965000,
			parent: "2",
			fragment: "Hello user!",
			id: "1128",
			parts: [
				{
					contentType: "multipart/alternative",
					name: "TEXT",
					parts: [
						{
							contentType: "text/plain",
							name: "1",
							parts: [],
							size: 14
						},
						{
							contentType: "text/html",
							name: "2",
							parts: [],
							size: 142
						}
					]
				}
			],
			read: false,
			flagged: true,
			attachment: true,
			size: 1448,
			subject: "Hello user"
		}
	}
];

describe('normalizeMessage', () => {
	test('Produces the correct message', async () => {
		forEach(
			tests,
			(testCase): void => {
				expect(normalizeMailMessageFromSoap(testCase.input)).toMatchObject(testCase.result);
			}
		)
	})
});
