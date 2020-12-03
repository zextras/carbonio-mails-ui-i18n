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
import { fireEvent } from '@testing-library/dom';
import reducers from '../../store/reducers';

import { generateConversation, generateMessage, generateState } from '../../mocks/generators';
import { normalizeMailMessageFromSoap } from '../../commons/normalize-message';
import { getTimeLabel } from '../../commons/utils';
import { selectFolders } from '../../store/folders-slice';
import MessageListItem from './message-list-item';
import { normalizeConversationFromSoap } from '../../commons/normalize-conversation';
import ConversationListItem from './conversation-list-item';


describe('MessageListItem', () => {
	test('Contains sender', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({}));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
			},
		);

		const sender = find(message.participants, ['type', 'f']);
		expect(screen.getByTestId('SenderText')).toContainHTML(sender.fullName);
	});

	test('Sender is colored `primary` if message is unread', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isRead: false }));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
			},
		);

		expect(screen.getByTestId('SenderText')).toHaveAttribute('color', 'primary');
	});

	test('Sender is colored `text` if message is read', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isRead: true }));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
			},
		);

		expect(screen.getByTestId('SenderText')).toHaveAttribute('color', 'text');
	});

	test('Contains date', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
			},
		);
		expect(screen.getByTestId('DateLabel')).toBeVisible();
		expect(screen.getByTestId('DateLabel')).toContainHTML(getTimeLabel(message.date));
	});

	test('Contains `flag` if message is flagged', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isFlagged: true }));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
			},
		);
		expect(screen.getByTestId('FlagIcon')).toBeInTheDocument();
	});

	test('Don\'t contain `flag` if message is not flagged', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isFlagged: false }));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
			},
		);
		expect(screen.queryByTestId('FlagIcon')).toBeNull();
	});

	test('Shows folder badge if message don\'t belong to current folder', async () => {
		const ctx = {};

		const folderId = '3';
		const message = normalizeMailMessageFromSoap(generateMessage({ folderId }));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ currentFolder: '2' }),
			},
		);

		const {name} = selectFolders(ctx.current.store.getState())[folderId];
		expect(screen.getByTestId('FolderBadge')).toContainHTML(name);
	});

	test('Doesn\'t show folder badge if message belong to current folder', async () => {
		const ctx = {};

		const messagefolderId = '3';
		const currentFolderId = '3';
		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: messagefolderId}));

		await testUtils.render(
			<MessageListItem message={message} folderId={currentFolderId} conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/${currentFolderId}`],
				preloadedState: generateState({ currentFolder: currentFolderId }),
			},
		);

		expect(screen.queryByTestId('FolderBadge')).toBeNull();
	});

	test('Contains fragment', async () => {
		const ctx = {};

		const messagefolderId = '3';
		const currentFolderId = '3';
		const message = normalizeMailMessageFromSoap(
			generateMessage({ folderId: messagefolderId, isRead: true, isFlagged: true })
		);

		await testUtils.render(
			<MessageListItem message={message} folderId={currentFolderId} conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/${currentFolderId}`],
				preloadedState: generateState({ currentFolder: currentFolderId }),
			},
		);

		expect(screen.getByTestId('Fragment')).toContainHTML(message.fragment);
	});

	test('Contains `urgent` icon if message is important', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isUrgent: true }));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
			},
		);
		expect(screen.getByTestId('UrgentIcon')).toBeInTheDocument();
	});

	test('Doesn\'t contain `urgent` icon if message is not important', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isUrgent: false }));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
			},
		);
		await expect(screen.queryByTestId('UrgentIcon')).toBeNull();
	});

	test('Contains `attachment` icon if message have attachments', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', hasAttachments: true }));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
			},
		);
		expect(screen.getByTestId('AttachmentIcon')).toBeInTheDocument();
	});

	test('Doesn\'t contain `attachment` icon if message have no attachments', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', hasAttachments: false }));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
			},
		);
		expect(screen.queryByTestId('AttachmentIcon')).toBeNull();
	});

	test('Click on message navigate to `?conversation={id}&message={id}`', async () => {
		const ctx = {};

		const message = normalizeMailMessageFromSoap(generateMessage({}));

		await testUtils.render(
			<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
			{
				ctxt: ctx,
				reducer: reducers,
				initialRouterEntries: [`/folder/2`],
			},
		);

		const expandButton = screen.getByTestId('SenderText');
		fireEvent.click(expandButton);
		expect(ctx.current.history.location.search).toEqual(`?conversation=${message.conversation}&message=${message.id}`);
	});

	// missing Tags and avatar
});
