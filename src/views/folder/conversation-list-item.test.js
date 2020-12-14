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
import { queryByTestId, screen } from '@testing-library/react';
import { filter, find, map, get } from 'lodash';
import faker from "faker";
import { fireEvent, getByTestId } from '@testing-library/dom';
import reducers from '../../store/reducers';

import { generateConversation, generateMessage, generateState } from '../../mocks/generators';
import { normalizeMailMessageFromSoap } from '../../commons/normalize-message';
import { getTimeLabel, participantToString } from '../../commons/utils';
import { selectFolders } from '../../store/folders-slice';
import MessageListItem from './message-list-item';
import ConversationListItem from './conversation-list-item';
import { normalizeConversationFromSoap } from '../../commons/normalize-conversation';


describe('ConversationListItem', () => {
	// Avatar

	test('Contains all participants', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({}));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		const conversationRow = screen.getByTestId('ConversationRow');
		const label = getByTestId(conversationRow, 'ParticipantLabel');

		expect(label).toBeDefined();

		conversation.participants.map(p => participantToString(p, str => str, []))
			.forEach(p => expect(label).toContainHTML(p));
	});

	test('Participants are colored `primary` if conversation is unread', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ isRead: false }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);
		const conversationRow = screen.getByTestId('ConversationRow');

		const label = getByTestId(conversationRow, 'ParticipantLabel');

		expect(label).toHaveAttribute('color', 'primary');
	});

	test('Participants is colored `text` if message is read', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ isRead: true }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		const label = screen.getByTestId('ParticipantLabel');

		expect(screen.getByTestId('ParticipantLabel')).toHaveAttribute('color', 'text');
	});

	test('Contains date', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ isRead: true }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);
		const conversationRow = screen.getByTestId('ConversationRow');
		const dateLabel = getByTestId(conversationRow, 'DateLabel');
		expect(dateLabel).toBeVisible();
		expect(dateLabel.innerHTML).toMatch(getTimeLabel(conversation.date));
	});

	test('Contains `flag` if message is flagged', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ isFlagged: true }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);
		const conversationRow = screen.getByTestId('ConversationRow');
		expect(getByTestId( conversationRow, 'FlagIcon')).toBeDefined();
	});

	test('Don\'t contain `flag` if message is not flagged', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ isFlagged: false }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);
		const conversationRow = screen.getByTestId('ConversationRow');
		expect(queryByTestId( conversationRow, 'FlagIcon')).toBeNull();
	});

	test('Contains subject if subject is not empty', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({}));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		const conversationRow = screen.getByTestId('ConversationRow');

		expect(getByTestId(conversationRow,'Subject').innerHTML).toMatch(conversation.subject);
		expect(queryByTestId(conversationRow,'NoSubject')).toBeNull();
	});

	test('Contains NoSubject if subject is empty', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({}));
		conversation.subject = '';

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		const conversationRow = screen.getByTestId('ConversationRow');

		expect(queryByTestId(conversationRow,'Subject')).toBeNull();
		expect(queryByTestId(conversationRow,'NoSubject').innerHTML).toBeDefined();
	});

	test('Contains fragment if not empty', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ isRead: true }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		const conversationRow = screen.getByTestId('ConversationRow');

		if(conversation.fragment)
			expect(getByTestId(conversationRow, 'Fragment')).toContainHTML(conversation.fragment);
	});

	test('Contains `urgent` icon if message is important', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ isUrgent: true }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		const conversationRow = screen.getByTestId('ConversationRow');

		expect(getByTestId(conversationRow, 'UrgentIcon')).toBeInTheDocument();
	});

	test('Doesn\'t contain `urgent` icon if message is not important', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ isUrgent: false }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		const conversationRow = screen.getByTestId('ConversationRow');

		expect(queryByTestId(conversationRow, 'UrgentIcon')).toBeNull();
	});

	test('Contains `attachment` icon if message have attachments', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ hasAttachments: true }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);
		const conversationRow = screen.getByTestId('ConversationRow');

		expect(getByTestId(conversationRow, 'AttachmentIcon')).toBeInTheDocument();
	});

	test('Doesn\'t contain `attachment` icon if message have no attachments', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ hasAttachments: false }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);
		const conversationRow = screen.getByTestId('ConversationRow');
		expect(queryByTestId(conversationRow, 'AttachmentIcon')).toBeNull();
	});

	test('Doesn\'t contain expand if contains 1 message', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ length: 1 }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		expect(screen.queryByTestId('ToggleExpand')).toBeNull();
	});

	test('Contains expand if contains more than 1 message', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({ length: 3 }));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		expect(screen.getByTestId('ToggleExpand')).toBeDefined();
	});

	test('Click on conversation navigate to `?conversation={id}`', async () => {
		const ctx = {};

		const conversation = normalizeConversationFromSoap(generateConversation({}));

		const folderId = '3';

		await testUtils.render(
			<ConversationListItem
				style={{}}
				index={1}
				conversation={conversation}
				folderId={folderId}
				displayData={{ open: false }}
				updateDisplayData={jest.fn()}
			/>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation]}),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		const expandButton = screen.getByTestId('ParticipantLabel');
		fireEvent.click(expandButton);
		expect(ctx.current.history.location.search).toEqual(`?conversation=${conversation.id}`)
	});
});
