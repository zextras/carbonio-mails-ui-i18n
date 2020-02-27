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

import React, { useReducer, useContext, useEffect, useCallback, useState } from 'react';
import { Container, ListHeader, Text } from '@zextras/zapp-ui';
import List from './List';
import {
	findIndex,
	map,
	reduce,
	orderBy,
	forEach
} from 'lodash';
import { useParams, useHistory } from 'react-router-dom';
import ConversationListItem from './ConversationListItem';
import mailContext from '../../context/MailContext';

const useBreadCrumbs = () => {
	const { path } = useParams();
	const history = useHistory();
	const splitPath = path.split('/')
	return reduce(splitPath, (acc, crumb, index) => {
		acc.push({
			label: crumb,
			click: () => history.push(`/mails/folder${
				reduce(
					splitPath,
					(to, part, index2) => `${to}${(index2 <= index) ? `/${part}` : ''}`,
					''
				)}`)
		});
		return acc;
	}, []);
};

export default function MailList() {
	const { conversations: convObs } = useContext(mailContext);
	const [amountSelected, setAmountSelected] = useState(0);
	const history = useHistory();
	const breadcrumbs = useBreadCrumbs();

	const cReducer = (state, action) => {
		const newState = [...state];
		switch (action.type) {
			case 'update':
				return action.convs;
			case 'selectAll':
				forEach(newState, c => {
					c.selected = true;
				});
				setAmountSelected(newState.length);
				return newState;
			case 'deselectAll':
				forEach(newState, c => {
					c.selected = false;
				});
				setAmountSelected(0);
				return newState;
			default: break;
		}
		const cIndex = findIndex(state, [['data', 'id'], action.id]);
		switch (action.type) {
			case 'select':
				if (!(newState[cIndex].selected)) {
					newState[cIndex].selected = true;
					setAmountSelected(amountSelected + 1);
				}
				return newState;
			case 'toggleOpen':
				newState[cIndex].open = action.value;
				return newState;
			case 'deselect':
				if (newState[cIndex].selected) {
					newState[cIndex].selected = false;
					setAmountSelected(amountSelected - 1);
				}
				return newState;
			default: return state;
		}
	};
	const [conversations, dispatch] = useReducer(cReducer, []);
	const extendList = useCallback((baseConvs) => map(baseConvs, (baseConv) => {
		const index = findIndex(conversations, ['id', baseConv.id]);
		if (index >= 0) {
			return {
				...conversations[index],
				data: {
					...conversations[index].data,
					...baseConv,
				}
			};
		}
		return {
			data: { ...baseConv },
			selected: false,
			open: false,
			onExpand: () => dispatch({ type: 'toggleOpen', value: true, id: baseConv.id }),
			onCollapse: () => dispatch({ type: 'toggleOpen', value: false, id: baseConv.id }),
			actions: [],
			onSelect: () => dispatch({ type: 'select', id: baseConv.id }),
			onDeselect: () => dispatch({ type: 'deselect', id: baseConv.id }),
		};
	}), [conversations]);

	useEffect(() => {
		const sub = convObs.subscribe((newConvs) => {
			dispatch({ type: 'update', convs: orderBy(extendList(newConvs), ['data.date'], ['desc']) });
		});
		return () => {
			sub.unsubscribe();
		};
	}, [convObs]);
	return (
		<Container
			orientation="vertical"
			width="fill"
			height="fill"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			background="bg_9"
		>
			<Container
				height="48px"
				style={{ minHeight: '48px' }}
			>
				<ListHeader
					breadCrumbs={breadcrumbs}
					actionStack={[]}
					selecting={amountSelected > 0}
					onSelectAll={() => dispatch({type: 'selectAll'})}
					onDeselectAll={() => dispatch({type: 'deselectAll'})}
					onBackClick={() => history.goBack()}
					allSelected={amountSelected === conversations.length}
				/>
			</Container>
			{conversations.length > 0
				&& (
					<List
						Factory={({ index }) => (
							<ConversationListItem
								selecting={amountSelected > 0}
								selectable
								open={conversations[index].open}
								onExpand={conversations[index].onExpand}
								onCollapse={conversations[index].onCollapse}
								conversation={conversations[index].data}
								selected={conversations[index].selected}
								onSelect={conversations[index].onSelect}
								onDeselect={conversations[index].onDeselect}
							/>
						)}
						amount={conversations.length}
					/>
				)}
		</Container>
	);
}
