import { forEach } from 'lodash';
import { normalizeMessage, IMsgItemObj } from '../../src/IMailSoap';
import { IMailSchm } from '../../src/idb/IMailSchema';

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
			bodyPath: "part[0].part[0]",
			contacts: [
				{
					address: "admin@70c49c70.testarea.zextras.com",
					name: "admin",
					type: "from"
				},
				{
					address: "user@70c49c70.testarea.zextras.com",
					name: "User",
					type: "to"
				}
			],
			conversationId: "1130",
			date: 1574335965000,
			folder: "2",
			fragment: "Hello user!",
			id: "1128",
			parts: [
				{
					contentType: "multipart/alternative",
					name: "TEXT",
					parts: [
						{
							contentType: "text/plain",
							filename: "Hello user!",
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
				expect(normalizeMessage(testCase.input)).toMatchObject(testCase.result);
			}
		)
	})
})
