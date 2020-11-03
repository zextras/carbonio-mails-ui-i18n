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

import { renderHook, act } from '@testing-library/react-hooks';

jest.mock('@zextras/zapp-shell');
// eslint-disable-next-line import/no-unresolved
import { hooks } from '@zextras/zapp-shell';
import { forEach, map } from 'lodash';
import useCompositionData, {
	draftToCompositionData,
	emptyDraft,
	extractBody,
	reducer,
	stateContactsFromDraft
} from './use-composition-data';

jest.mock('../db/mails-db-dexie');
jest.mock('../db/mails-db');
import { MailsDb } from '../db/mails-db';

describe('useCompositionData', () => {
	test.skip('reducer', () => {
		const state = emptyDraft;
		const actions = [
			{
				type: 'RESET',
				payload: {
					state: {
						richText: true,
						subject: 'subject',
						urgent: false,
						flagged: true,
						to: [{ value: 'to1' }, { value: 'to2' }],
						cc: [{ value: 'cc1' }, { value: 'cc2' }],
						bcc: [{ value: 'bcc1' }, { value: 'bcc2' }],
						body: {
							text: 'ciao',
							html: '<h1>ciao</h1>'
						}
					}
				}
			},
			{
				type: 'UPDATE_SUBJECT',
				payload: {
					value: 'hello subject'
				}
			},
			{
				type: 'UPDATE_CONTACTS',
				payload: {
					type: 'to',
					value: [{ value: 'toContact' }]
				}
			},
			{
				type: 'UPDATE_BODY',
				payload: {
					html: '<p>updated body</p>',
					text: 'updated body'
				}
			},
			{
				type: 'TOGGLE_RICH_TEXT',
				payload: {
					richText: true
				}
			},
			{
				type: 'TOGGLE_FLAGGED',
				payload: {
					flagged: true
				}
			},
			{
				type: 'TOGGLE_URGENT',
				payload: {
					urgent: true
				}
			},
			{
				type: 'gnagna'
			}
		];
		const expectedResults = [
			{
				richText: true,
				subject: 'subject',
				urgent: false,
				flagged: true,
				to: [{ value: 'to1' }, { value: 'to2' }],
				cc: [{ value: 'cc1' }, { value: 'cc2' }],
				bcc: [{ value: 'bcc1' }, { value: 'bcc2' }],
				body: {
					text: 'ciao',
					html: '<h1>ciao</h1>'
				}
			},
			{
				...emptyDraft,
				subject: 'hello subject'
			},
			{
				...emptyDraft,
				to: [{ value: 'toContact' }]
			},
			{
				...emptyDraft,
				body: {
					html: '<p>updated body</p>',
					text: 'updated body'
				}
			},
			{
				...emptyDraft,
				richText: false
			},
			{
				...emptyDraft,
				flagged: true
			},
			{
				...emptyDraft,
				urgent: true
			},
			emptyDraft,
		];
		const results = map(actions, (action) => reducer(state, action));
		forEach(results, (result, index) => expect(result).toStrictEqual(expectedResults[index]));
	});

	test('stateContactsFromDraft', () => {
		const baseContacts = [
			{
				type: 't',
				address: 't.ciao@ciao.ciao',
				displayName: 'TdisplayName'
			},
			{
				type: 'c',
				address: 'cc.ciao@ciao.ciao',
				displayName: 'CdisplayName'
			},
			{
				type: 'b',
				address: 'bcc.ciao@ciao.ciao',
				displayName: 'BdisplayName'
			}
		];
		const cases = [
			{
				input: {
					contacts: baseContacts
				},
				type: 't',
				expected: [{
					value: 't.ciao@ciao.ciao'
				}]
			},
			{
				input: {
					contacts: baseContacts
				},
				type: 'c',
				expected: [{
					value: 'cc.ciao@ciao.ciao'
				}]
			},
			{
				input: {
					contacts: baseContacts
				},
				type: 'b',
				expected: [{
					value: 'bcc.ciao@ciao.ciao'
				}]
			},
			{
				input: {
					contacts: [
						{
							type: 't',
							address: 't.ciao@ciao.ciao',
							displayName: 'TdisplayName'
						},
						{
							type: 't',
							address: 't.ciao@ciao.ciao'
						}
					]
				},
				type: 't',
				expected: [
					{
						value: 't.ciao@ciao.ciao'
					},
					{
						value: 't.ciao@ciao.ciao'
					}
				]
			}
		];
		forEach(
			cases,
			(item) => expect(stateContactsFromDraft(item.input, item.type)).toStrictEqual(item.expected)
		);
	});

	test('extractBody', () => {
		const cases = [
			{
				input: {
					parts: [
						{
							contentType: 'multipart/alternative',
							parts: [
								{
									contentType: 'text/html',
									content: 'hello in HTML'
								},
								{
									contentType: 'text/plain',
									content: 'hello plain'
								}
							]
						}
					]
				},
				expected: {
					text: '',
					html: 'hello in HTML'
				}
			},
			{
				input: {
					parts: [
						{
							contentType: 'text/plain',
							content: 'hello plain'
						}
					]
				},
				expected: {
					text: 'hello plain',
					html: ''
				}
			}
		];
		forEach(
			cases,
			(item) => expect(extractBody(item.input)).toStrictEqual(item.expected)
		);
	});

	test('draftToCompositionData', () => {
		const cases = [
			{
				input: {
					parts: [
						{
							contentType: 'multipart/alternative',
							parts: [
								{
									contentType: 'text/html',
									content: 'hello in HTML'
								},
								{
									contentType: 'text/plain',
									content: 'hello plain'
								}
							]
						}
					],
					contacts: [
						{
							type: 't',
							address: 't.ciao@ciao.ciao',
							displayName: 'TdisplayName'
						},
						{
							type: 'c',
							address: 'cc.ciao@ciao.ciao',
							displayName: 'CdisplayName'
						},
						{
							type: 'b',
							address: 'bcc.ciao@ciao.ciao',
							displayName: 'BdisplayName'
						}
					],
					urgent: true,
					flagged: true,
					subject: 'subject'
				},
				expected: {
					body: {
						text: '',
						html: 'hello in HTML'
					},
					richText: true,
					urgent: true,
					flagged: true,
					subject: 'subject',
					to: [{ value: 't.ciao@ciao.ciao' }],
					cc: [{ value: 'cc.ciao@ciao.ciao' }],
					bcc: [{ value: 'bcc.ciao@ciao.ciao' }]
				}
			},
		];
		forEach(
			cases,
			(item) => expect(draftToCompositionData(item.input)).toStrictEqual(item.expected)
		);
	});

	test.skip('useCompositionData', async () => {
		const db = new MailsDb();
		// db.messages.get.mockImplementation(() => Promise.resolve('ciaoooo'));
		hooks.useReplaceHistoryCallback.mockImplementation(() => (() => undefined));
		hooks.useAppContext.mockImplementation(() => ({ db }));
		hooks.useObserveDb.mockImplementation(() => Promise.resolve([{
			parts: [
				{
					contentType: 'text/html',
					content: 'hello in HTML'
				},
				{
					contentType: 'text/plain',
					content: 'hello plain'
				}
			],
			contacts: [
				{
					type: 't',
					address: 't.ciao@ciao.ciao',
					displayName: 'TdisplayName'
				},
				{
					type: 'c',
					address: 'cc.ciao@ciao.ciao',
					displayName: 'CdisplayName'
				},
				{
					type: 'b',
					address: 'bcc.ciao@ciao.ciao',
					displayName: 'BdisplayName'
				}
			],
			urgent: true,
			flagged: true,
			subject: 'subject'
		}, true]));
		const { result, waitForNextUpdate } = renderHook(
			() => useCompositionData('gnagna', true, 'safga')
		);
		expect(result).toBe({});
	});
});
