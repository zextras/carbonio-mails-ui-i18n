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
import React, { Suspense } from 'react';
import {render, screen} from '@testing-library/react'
import { testUtils } from '@zextras/zapp-shell';
import { Route } from 'react-router-dom';
import faker from "faker";
import { getByTestId, getByText, waitFor } from '@testing-library/dom';
import ConversationPreviewPanel from './conversation-preview-panel';
import reducers from '../../store/reducers';
import { generateState } from '../../mocks/generators';

import { selectMessages } from '../../store/messages-slice';
import {
	selectConversationMap,
} from '../../store/conversations-slice';

describe('ConversationPreviewPanel', () => {
	test('Navigation to url download the conversation', async () => {
// 		// Test that the navigation to a url
// 		const conversationId = faker.random.number().toString();
// 		const ctx = {};
//
// 		await testUtils.render(
// 			<Route path="/folder/:folderId">
// 				<ConversationPreviewPanel />
// 			</Route>,
// 			{
// 				ctxt: ctx,
// 				initialRouterEntries: [`/folder/3?conversation=${conversationId}`],
// 				reducer: reducers,
// 				preloadedState: generateState({}),
// 			},
// 		);
// 		await screen.findByText('MailPreview');
//
// 		const conversation = selectConversationMap(ctx.current.store.getState())[conversationId];
// 		const firstMessage = selectMessages(ctx.current.store.getState())[conversation.messages[0].id];
//
// 		expect(conversation).toBeDefined();
// 		expect(firstMessage).toBeDefined();
// 		expect(getByText(document.documentElement, conversation.subject)).toBeInTheDocument();
//
// 		// fist message is rendered
// 		expect(document.documentElement.querySelector(`iframe[title='${firstMessage.id}']`)).toBeDefined();
//
// 		// other messages are not rendered
// 		for(let i=0; i<conversation.messages.length; i +=1) {
// 			const mailPreview = screen.getByTestId(`MailPreview-${conversation.messages[i].id}`);
//
// 			expect(mailPreview).toBeDefined();
//
// 			// The first message is expanded, the others aren't
// 			if(i === 0)
// 				expect(mailPreview.querySelector(`div[class^="Collapse"][open]`)).toBeTruthy();
// 			else
// 				expect(mailPreview.querySelector(`div[class^="Collapse"][open]`)).toBeNull();
// 		}
	});
});
