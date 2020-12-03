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

// jest.useFakeTimers();
import { configureStore } from '@reduxjs/toolkit';
import { network } from '@zextras/zapp-shell';
import { performSync, startSync } from './sync-slice';
import { sync } from './actions';
import reducers from './reducers';

describe('Sync Slice', () => {
	test('Mocked handler for Sync', async () => {
		const obj1 = await network.soapFetch('Sync', {
			_jsns: 'urn:zimbraMail',
		});
		expect(JSON.stringify(obj1, null, 2)).toMatchSnapshot();
		const obj2 = await network.soapFetch('Sync', {
			_jsns: 'urn:zimbraMail',
			token: '0'
		});
		expect(JSON.stringify(obj2, null, 2)).toMatchSnapshot();
	});

	test('Perform first sync', async () => {
		const store = configureStore({
			reducer: reducers
		});

		expect(store.getState().sync.status).toEqual('init');
		expect(store.getState().sync.token).toBeUndefined();
		await store.dispatch(
			startSync()
		);
		expect(store.getState().sync.status).toEqual('idle');
		expect(store.getState().sync.token).toEqual('0');
		await store.dispatch(
			sync()
		);
		expect(store.getState().sync.token).toEqual('1');
	});
});
