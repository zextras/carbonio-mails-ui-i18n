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
import * as faker from 'faker';
import { testUtils } from '@zextras/zapp-shell';
import { find } from 'lodash';
import { findByTestId, screen } from '@testing-library/react';
import React from 'react';
import { Route } from 'react-router-dom';
import { fireEvent, getByTestId } from '@testing-library/dom';
import { generateConversation, generateConversations, generateState } from '../../mocks/generators';
import reducers from '../../store/reducers';
import FolderView, { Breadcrumbs } from './mails-folder-view';
import { normalizeConversationFromSoap } from '../../commons/normalize-conversation';

describe('Breadcrumb', () => {
	test('Shows correct path', async () => {
		const path =  `/${  faker.lorem.words(2).concat('/')}`;

		await testUtils.render(
			<Breadcrumbs folderPath={ path } itemsCount={10} />,
			{
				ctxt: {},
			},
		);

		expect(screen.getByTestId('BreadcrumbPath')).toContainHTML(path.split('/').join(' / '));
	});

	test('Shows correct Count if count <=100', async () => {
		const itemCount = 10

		await testUtils.render(
			<Breadcrumbs folderPath=' ' itemsCount={itemCount} />,
			{
				ctxt: {},
			},
		);

		expect(screen.getByTestId('BreadcrumbCount')).toHaveTextContent(itemCount);

	});

	test('Shows correct Count if count >100', async () => {
		const itemCount = 110

		await testUtils.render(
			<Breadcrumbs folderPath=' ' itemsCount={itemCount} />,
			{
				ctxt: {},
			},
		);

		expect(screen.getByTestId('BreadcrumbCount')).toHaveTextContent('100+');
	});


});

describe('FolderView', () => {
	test('Contains all stored conversations', async () => {
		const ctx = {};

		const folderId = '2';

		const conversations = generateConversations(folderId, 10).map(normalizeConversationFromSoap);

		await testUtils.render(
			<Route path="/folder/:folderId">
				<FolderView />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations, currentFolder: folderId }),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		await screen.findByTestId(`ConversationListItem-${conversations[0].id}`);

		conversations.forEach(c => {
			expect(screen.getByTestId(`ConversationListItem-${c.id}`)).toBeVisible();
		});
	});

	test('Expanding a conversation ', async () => {
		const ctx = {};

		const folderId = '2';

		const conversation = normalizeConversationFromSoap(generateConversation({ folderId, length: 4 }));
		conversation.messages[1].parent = folderId;

		const { rerender } = await testUtils.render(
			<Route path="/folder/:folderId">
				<FolderView />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation], currentFolder: folderId }),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		const conversationElement = await screen.findByTestId(`ConversationListItem-${conversation.id}`);

		fireEvent.click(await findByTestId(conversationElement, 'ToggleExpand'));

		// eslint-disable-next-line no-restricted-syntax
		for (const m of conversation.messages) {
			// Don't show messages in Trash or Spam
			if(m.parent !== '3' && m.parent !== '4') {
				// eslint-disable-next-line no-await-in-loop
				expect(await screen.findByTestId(`MessageListItem-${m.id}`)).toBeDefined();
			}
		}
	});

	test('Expanding and Collapsing a conversation ', async () => {
		const ctx = {};

		const folderId = '2';

		const conversation = normalizeConversationFromSoap(generateConversation({ folderId, length: 4 }));
		conversation.messages[1].parent = folderId;

		const { rerender } = await testUtils.render(
			<Route path="/folder/:folderId">
				<FolderView />
			</Route>,
			{
				ctxt: ctx,
				reducer: reducers,
				preloadedState: generateState({ conversations: [conversation], currentFolder: folderId }),
				initialRouterEntries: [`/folder/${folderId}`],
			},
		);

		const conversationElement = await screen.findByTestId(`ConversationListItem-${conversation.id}`);

		fireEvent.click(await findByTestId(conversationElement, 'ToggleExpand'));

		// eslint-disable-next-line no-restricted-syntax
		for (const m of conversation.messages) {
			// Don't show messages in Trash or Spam
			if(m.parent !== '3' && m.parent !== '4') {
				// eslint-disable-next-line no-await-in-loop
				expect(await screen.findByTestId(`MessageListItem-${m.id}`)).toBeDefined();
			}
		}

		fireEvent.click(await findByTestId(conversationElement, 'ToggleExpand'));

		expect(getByTestId(conversationElement, 'ConversationExpander')).not.toBeVisible();
	});

});