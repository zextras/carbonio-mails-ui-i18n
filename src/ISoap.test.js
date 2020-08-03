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

import { normalizeMailMessageFromSoap, _getParentPath, getBodyToRender } from './ISoap';

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
							size: 14
						},
						{
							contentType: "text/html",
							name: "2",
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

describe.skip('normalizeMessage', () => {
	test('Produces the correct message', () => {
		expect(normalizeMailMessageFromSoap(tests[0].input)).toMatchObject(tests[0].result);
	});
});

describe.skip('SOAP Utils', () => {
	test('_getParentPath', () => {
		expect(_getParentPath('parts[0].parts[0].parts[1].parts[0]')).toBe('parts[0].parts[0].parts[1]');
	});

	test('getBodyToRender', () => {
		expect(getBodyToRender({
			"conversation": "265",
			"id": "264",
			"date": 1581951719000,
			"size": 159165,
			"parent": "2",
			"parts": [
				{
					"contentType": "multipart/mixed",
					"size": 0,
					"name": "TEXT",
					"parts": [
						{
							"contentType": "multipart/alternative",
							"size": 0,
							"name": "1",
							"parts": [
								{
									"contentType": "text/plain",
									"size": 0,
									"name": "1.1"
								},
								{
									"contentType": "multipart/related",
									"size": 0,
									"name": "1.2",
									"parts": [
										{
											"contentType": "text/html",
											"size": 261,
											"name": "1.2.1",
											"content": "<html><body><div style=\"font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000\"><div><img src=\"cid:a14524d10cdf8e078a54509a2f4ff4c33d88fdf1&#64;zimbra\" data-mce-src=\"cid:a14524d10cdf8e078a54509a2f4ff4c33d88fdf1&#64;zimbra\" /></div></div></body></html>"
										},
										{
											"contentType": "image/jpeg",
											"size": 67321,
											"name": "1.2.2",
											"filename": "La Monna Patrick.jpg",
											"cd": "inline",
											"ci": "<a14524d10cdf8e078a54509a2f4ff4c33d88fdf1@zimbra>"
										}
									]
								}
							]
						},
						{
							"contentType": "image/jpeg",
							"size": 47281,
							"name": "2",
							"filename": "Culo.jpeg"
						}
					]
				}
			],
			"bodyPath": "parts[0].parts[0].parts[1].parts[0]",
			"subject": "Hello, world!",
			"contacts": [
				{
					"type": "f",
					"address": "admin@cc6ce14e.testarea.zextras.com",
					"displayName": "admin"
				},
				{
					"type": "t",
					"address": "admin@cc6ce14e.testarea.zextras.com",
					"displayName": "admin"
				}
			],
			"read": true,
			"attachment": true,
			"flagged": false,
			"urgent": false
		})).toStrictEqual(
			[
				{
					"content": "<html><body><div style=\"font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000\"><div><img src=\"cid:a14524d10cdf8e078a54509a2f4ff4c33d88fdf1&#64;zimbra\" data-mce-src=\"cid:a14524d10cdf8e078a54509a2f4ff4c33d88fdf1&#64;zimbra\" /></div></div></body></html>",
					"contentType": "text/html",
					"name": "1.2.1",
					"size": 261,
				},
				[
					{"ci": "<a14524d10cdf8e078a54509a2f4ff4c33d88fdf1@zimbra>", "contentType": "image/jpeg", "filename": "La Monna Patrick.jpg", "name": "1.2.2", "size": 67321, cd: 'inline'}
				]
			]
		);
	});
});
