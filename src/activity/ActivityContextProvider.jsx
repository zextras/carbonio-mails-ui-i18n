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
import React, { useReducer, useEffect } from 'react';
import { reduce, trim, split } from 'lodash';
import { useHistory } from 'react-router-dom';
function reducer(state, action) {
	switch (action.type) {
		case 'set':
			return { ...state, [action.name]: action.id };
		case 'pull':
			if (action.name) {

			}
			return state;
		case 'push':
			if (action.name) {
				return { ...state, [action.name]: `${state[action.name]},${action.id}` };
			}
			return { ...state, [action.name]: action.id };
		default:
			throw new Error();
	}
}

const ActivityContextProvider = ({ children }) => {
	const history = useHistory();

	const [activities, dispatch] = useReducer(
		reducer,
		reduce(
			split(
				trim(
					history.location.search,
					'?'
				),
				'&'
			),
			(acc, action) => {
				const [name, values] = split(action, '=');
				if (name !== '') acc[name] = values;
				return acc;
			},
			{}
		)
	);

	return (
		<activityContext.Provider
			value={{
				get: (name) => activities[name],
				set: (name, id) => dispatch({ type: 'set', name, id }),
				push: (name, id) => dispatch({ type: 'push', name, id }),
				pull: (name, id) => dispatch({ type: 'pull', name, id })
			}}
		>
			{children}
		</activityContext.Provider>
	);
};

export default ActivityContextProvider;
