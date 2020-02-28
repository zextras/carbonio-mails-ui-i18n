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
import React, { useReducer } from 'react';
import { omit, without } from 'lodash';

const pull = (state, name, value) => {
	const newValue = without(state[name], value);
	if (newValue.length === 0) return omit(state, [name]);
	return { ...state, [name]: newValue };
};

const reducer = (state, { type, name, value }) => {
	switch (type) {
		case 'set': return { ...state, [name]: value };
		case 'reset': return omit(state, [name]);
		case 'push': return { ...state, [name]: state[name] ? state[name].push(value) : [value] };
		case 'pull':
			return pull(state, name, value);
		default: return state;
	}
};

const ActivityContextProvider = ({ children }) => {
	const [activities, dispatch] = useReducer(reducer, {});
	return (
		<activityContext.Provider
			value={{
				activities,
				get: (name) => activities[name],
				set: (name, value) => dispatch({ type: 'set', name, value }),
				reset: (name) => dispatch({ type: 'reset', name }),
				push: (name, value) => dispatch({ type: 'push', name, value }),
				pull: (name, value) => dispatch({ type: 'pull', name, value }),
			}}
		>
			{children}
		</activityContext.Provider>
	);
};

export default ActivityContextProvider;
