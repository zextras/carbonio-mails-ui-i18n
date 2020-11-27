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
import { screen } from '@testing-library/react';
import { filter, find, map, get } from 'lodash';
import faker from "faker";
import reducers from '../../store/reducers';

import MailPreview from './mail-preview';
import { generateMessage, generateState } from '../../mocks/generators';
import { normalizeMailMessageFromSoap } from '../../commons/normalize-message';
import { getTimeLabel } from '../../commons/utils';
import { selectFolders } from '../../store/folders-slice';
import { selectMessages, selectMessagesStatus } from '../../store/messages-slice';
import MessageListItem from '../folder/message-list-item';

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

		const cc = [
			{
				name: faker.name.findName(),
				email: faker.internet.email(),
			},
			{
				name: faker.name.findName(),
				email: faker.internet.email(),
			}
		];

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', cc }));


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

	test('Contains `flag` if message is flagged', async () => {
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

	test('Don\'t contain `flag` if message is not flagged', async () => {
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
		expect(screen.queryByTestId('FlagIcon')).toBeNull();
	});

	test('Shows folder badge if message don\'t belong to current folder', async () => {
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

		const mailPreview = screen.getByTestId(`MailPreview-${message.id}`);
		expect(mailPreview).toBeDefined();

		const {name} = selectFolders(ctx.current.store.getState())[folderId];
		expect(screen.getByTestId('FolderBadge')).toContainHTML(name);
	});

	test('Doesn\'t show folder badge if message belong to current folder', async () => {
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
				initialRouterEntries: [`/folder/3`],
				preloadedState: generateState({ messages: [message], currentFolder: '3' }),
			},
		);

		const mailPreview = screen.getByTestId(`MailPreview-${message.id}`);
		expect(mailPreview).toBeDefined();

		expect(screen.queryByTestId('FolderBadge')).toBeNull();
	});

	test('Contains `urgent` icon if message is important', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isUrgent: true }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={false} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/3`],
				preloadedState: generateState({ messages: [message], currentFolder: '3' }),
			},
		);
		expect(screen.getByTestId('UrgentIcon')).toBeInTheDocument();
	});

	test('Doesn\'t contain `urgent` icon if message is not important', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isUrgent: false }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={false} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/3`],
				preloadedState: generateState({ messages: [message], currentFolder: '3' }),
			},
		);
		await expect(screen.queryByTestId('UrgentIcon')).toBeNull();
	});

	test('Contains fragment if not expanded', async () => {
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
		expect(screen.queryByText(message.fragment)).not.toBeNull();
	});

	test('Downloads message if expanded and not saved', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

		await testUtils.render(
			<Route path="/folder/:folderId">
				<MailPreview message={message} expanded={true} />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
				preloadedState: generateState({}),
			},
		);

		await screen.findByTestId('MessageBody');

		expect(selectMessages(ctx.current.store.getState())[message.id]).not.toBe(message);
	});
});
