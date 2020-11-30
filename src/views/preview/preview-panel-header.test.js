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
import { screen } from '@testing-library/react'
import { testUtils } from '@zextras/zapp-shell';
import userEvent from '@testing-library/user-event';
import reducers from '../../store/reducers';
import preloadedState from '../../mocks/states/folder-3-conversation-17736.json';
import PreviewPanelHeader from './preview-panel-header';
import { generateConversation } from '../../mocks/generators';
import { normalizeConversationFromSoap } from '../../commons/normalize-conversation';

describe('PreviewPanelHeader', () => {
	test('Contains Subject', async () => {
		const conversation = normalizeConversationFromSoap(generateConversation({}));

		const ctxt = {};

		await testUtils.render(
			<PreviewPanelHeader folderId={ '3' } conversation={ conversation } />,
			{
				ctxt,
				reducer: reducers,
			},
		);
		expect(screen.getByTestId('PreviewPanelHeader')).toBeInTheDocument();
		expect(screen.getByTestId('PreviewPanelHeader')).toContainHTML(conversation.subject);
	});

	test('Contains (No subject) if subject is empty', async () => {
		const conversation = normalizeConversationFromSoap(generateConversation({ subject: '' }));

		const ctxt = {};

		await testUtils.render(
			<PreviewPanelHeader folderId={ '3' } conversation={ conversation } />,
			{
				ctxt,
				reducer: reducers,
			},
		);
		expect(screen.getByTestId('Subject')).toContainHTML('(No Subject)');
	});

	test('Contains Read icon if conversation read', async () => {
		const conversation = normalizeConversationFromSoap(generateConversation({ isRead: true }));

		const ctxt = {};
		await testUtils.render(
			<PreviewPanelHeader folderId={ '3' } conversation={ conversation }/>,
			{
				ctxt,
				reducer: reducers,
			},
		);

		expect(screen.getByTestId('EmailReadIcon')).toBeDefined();
		expect(screen.getByTestId('PreviewPanelHeader')).not.toContainHTML('EmailUnreadIcon');
	});

	test('Contains Unread icon if conversation unread', async () => {
		const conversation = normalizeConversationFromSoap(generateConversation({ isRead: false }));

		const ctxt = {};
		await testUtils.render(
			<PreviewPanelHeader folderId={ '3' } conversation={ conversation }/>,
			{
				ctxt,
				reducer: reducers,
			},
		);

		expect(screen.getByTestId('EmailUnreadIcon')).toBeDefined();
		expect(screen.getByTestId('PreviewPanelHeader')).not.toContainHTML('EmailReadIcon');
	});

	test('Contain close icon', async () => {
		const conversation = normalizeConversationFromSoap(generateConversation({}));

		const ctxt = {};

		await testUtils.render(
			<PreviewPanelHeader folderId={ '3' } conversation={ conversation }/>,
			{
				ctxt,
				reducer: reducers,
			},
		);
		expect(screen.getByTestId('PreviewPanelCloseIcon')).toBeDefined();
	});
});
