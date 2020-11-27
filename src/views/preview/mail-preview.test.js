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
import React from 'react';
import { testUtils } from '@zextras/zapp-shell';
import { Route } from 'react-router-dom';
import { getByText, waitFor } from '@testing-library/dom';
import { screen } from '@testing-library/react';
import { filter, find, map, get } from 'lodash';
import faker from "faker";
import reducers from '../../store/reducers';

import { selectMessages, selectMessagesStatus } from '../../store/messages-slice';
import MailPreview from './mail-preview';
import { generateMessage, generateState } from '../../mocks/generators';
import { normalizeMailMessageFromSoap } from '../../commons/normalize-message';
import { getTimeLabel } from '../../commons/utils';
import { selectFolders } from '../../store/folders-slice';
import { fulfilledWhen } from '../../commons/test-utils';

describe('MailPreview', () => {
	test('Contains sender', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={false} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
				preloadedState: generateState({ messages: [message] }),
			},
		);

		const sender = find(message.participants, ['type', 'f']);
		expect(screen.getByTestId('SenderText')).toContainHTML(sender.fullName);
	});

	test('Sender is colored `primary` if message is unread', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isRead: false }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={false} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
				preloadedState: generateState({ messages: [message] }),
			},
		);

		expect(screen.getByTestId('SenderText')).toHaveAttribute('color', 'primary');
	});

	test('Sender is colored `text` if message is read', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isRead: true }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={false} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
				preloadedState: generateState({ messages: [message] }),
			},
		);

		expect(screen.getByTestId('SenderText')).toHaveAttribute('color', 'text');
	});

	test('Contains date', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={false} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
				preloadedState: generateState({ messages: [message] }),
			},
		);
		expect(screen.getByTestId('DateLabel')).toBeVisible();
		expect(screen.getByTestId('DateLabel')).toContainHTML(getTimeLabel(message.date));
	});

	test('Contains To section', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={false} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
				preloadedState: generateState({ messages: [message] }),
			},
		);

		const toContacts = filter(message.participants, ['type', 't'])[0];

		const toSection = screen.getByTestId('ToParticipants');
		expect(toSection).toBeVisible();
		expect(toSection).toContainHTML(`To: ${toContacts.fullName}`);
	});

	test('Contains CC section', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

		message.participants.push(
			{
				"a": faker.internet.email(),
				"d": faker.name.lastName(),
				"p": faker.name.findName(),
				"t": "c"
			}
		);

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={false} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
				preloadedState: generateState({ messages: [message] }),
			},
		);

		const ccContacts = filter(message.participants, ['type', 'c']);

		const ccSection = screen.getByTestId('CcParticipants');
		expect(ccSection).toBeVisible();
		expect(ccSection).toContainHTML(`Cc: ${ccContacts.map(c => c.fullName).join(', ')}`);
	});

	test('Contains flag if message is flagged', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isFlagged: true }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={false} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
				preloadedState: generateState({ messages: [message] }),
			},
		);
		expect(screen.getByTestId('FlagIcon')).toBeInTheDocument();
	});

	test('Don\t contain flag if message is not flagged', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isFlagged: false }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={false} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
				preloadedState: generateState({ messages: [message] }),
			},
		);
		expect(screen.queryByTestId('FlagIcon')).toBe;
	});

	test('Show folder chip', async () => {
		const ctx = {};

		const folderId = '3';
		const message = normalizeMailMessageFromSoap(generateMessage({ folderId, isRead: true, isFlagged: true }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={false} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
				preloadedState: generateState({ messages: [message], currentFolder: '2' }),
			},
		);

		// not downloaded since already present
		expect(selectMessages(ctx.current.store.getState())[message.id]).toBe(message);

		const mailPreview = screen.getByTestId(`MailPreview-${message.id}`);
		expect(mailPreview).toBeDefined();

		const {name} = selectFolders(ctx.current.store.getState())[folderId];
		expect(mailPreview.querySelector(`span[class^="Badge"]`)).toContainHTML(name);

		if(message.flagged)
			expect(mailPreview.querySelector("path [data-name='flag']")).toBeDefined();
		else
			expect(mailPreview.querySelector("path [data-name='flag']")).toBeNull();

		expect(mailPreview).toContainHTML(getTimeLabel(message.date));

		// sender and read/unread


		if(message.read) {
			expect(mailPreview.querySelector(`div [color='text']`)).toContainHTML(sender.fullName);
		}
		else
			expect(mailPreview.querySelector(`div [color='primary']`)).toContainHTML(sender.fullName);

		message.participants.forEach(p => {
			expect(mailPreview).toContainHTML(sender.fullName);
		});

		// fragment considering that the message is not expanded
		expect(getByText(mailPreview, message.fragment)).toBeDefined();
	});

	test('Download message if expanded and not saved', async () => {
		const ctx = {};

		let message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
				preloadedState: generateState({}),
			},
		);

		await waitFor(() => fulfilledWhen(() => selectMessagesStatus(ctx.current.store.getState())[message.id] === 'complete'));

		expect(selectMessages(ctx.current.store.getState())[message.id]).not.toBe(message);

		message = selectMessages(ctx.current.store.getState())[message.id];

		const mailPreview = screen.getByTestId(`MailPreview-${message.id}`);

		expect(mailPreview).toBeDefined();

		// contains date of new message
		expect(mailPreview).toContainHTML(getTimeLabel(message.date));
	});
});
