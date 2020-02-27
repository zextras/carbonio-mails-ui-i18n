/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import activityContext from './ActivityContext';
import React from 'react';
import { reduce, trim, split } from 'lodash';
import { useHistory } from 'react-router-dom';

const get = (name, history) => {
	const params = new URLSearchParams(history.location.search);
	return { value: params.get(name), hash: history.location.hash };
};

const set = (name, id, hash, history) => {
	const params = new URLSearchParams(history.location.search);
	params.set(name, id);
	history.push({
		search: params.toString(),
		hash
	});
};

const reset = (name, history) => {
	const params = new URLSearchParams(history.location.search);
	params.delete(name);
	history.push({
		search: params.toString(),
	});
};

const push = (name, id, hash, history) => {
	const params = new URLSearchParams(history.location.search);
	if (params.has(name)) {
		params.set(name, `${params.get(name)}.${id}`);
	}
	else {
		params.append(name, id);
	}
	history.push({
		search: params.toString(),
		hash
	});
};

const pull = (name, id, history) => {
	const params = new URLSearchParams(history.location.search);
	if (params.has(name)) {
		params.set(
			name,
			trim(
				reduce(
					split(params.get(name), '.'),
					(acc, value) => (value === id ? '' : `${value}.`),
					''
				),
				['.']
			)
		);
		if (params.get(name) === '') params.delete(name);
		history.push({
			search: params.toString()
		});
	}
};

const ActivityContextProvider = ({ children }) => {
	const history = useHistory();

	return (
		<activityContext.Provider
			value={{
				get: (name) => get(name, history),
				set: (name, id, hash) => set(name, id, hash, history),
				reset: (name) => reset(name, history),
				push: (name, id, hash) => push(name, id, hash, history),
				pull: (name, id) => pull(name, id, history),
			}}
		>
			{children}
		</activityContext.Provider>
	);
};

export default ActivityContextProvider;
