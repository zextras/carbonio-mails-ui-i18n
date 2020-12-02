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

import { configureStore } from '@reduxjs/toolkit';
import reducers from './reducers';
import { getMsg } from './actions';
import { selectMessages } from './messages-slice';

describe('Messages Slice', () => {
	describe('GetMsg', () => {
		test('on new store', async () => {
			const store = configureStore({
				reducer: reducers
			});

			const msgId = '1';

			await store.dispatch(
				getMsg({ msgId  })
			);

			const messages = selectMessages(store.getState());
			const readMessage = messages[msgId];

			expect(readMessage).toBeDefined();
			expect(readMessage.parts.length).toBeGreaterThan(0);
		});
	});

	describe('GetMsg', () => {
		test('on new store', async () => {
			const store = configureStore({
				reducer: reducers
			});

			const msgId = '1';

			await store.dispatch(
				getMsg({ msgId  })
			);

			const messages = selectMessages(store.getState());
			const readMessage = messages[msgId];

			expect(readMessage).toBeDefined();
			expect(readMessage.parts.length).toBeGreaterThan(0);
		});
	});
});