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

import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';

function setAccountsReducer(state, { payload }) {
	state.accounts = payload;
}

const accountsSlice = createSlice({
	name: 'accounts',
	initialState: {
		accounts: []
	},
	reducers: {
		setAccounts: produce(setAccountsReducer)
	}
});

export const { setAccounts } = accountsSlice.actions;

export default accountsSlice.reducer;

export function selectAccounts({ accounts }) {
	return accounts.accounts;
}
