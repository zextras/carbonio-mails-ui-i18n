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

import React, { useState, useContext, useReducer, useEffect } from 'react';
import { Container, Divider, ListHeader, List } from '@zextras/zapp-ui';
import {
	reduce,
	omit,
	forEach
} from 'lodash';
import { useParams, useHistory } from 'react-router-dom';
import ConversationListItem from './ConversationListItem';
import ConversationFolderCtxt from '../../context/ConversationFolderCtxt';

const useBreadCrumbs = () => {
	const { path } = useParams();
	const history = useHistory();
	const splitPath = path.split('/');
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

const useSelection = () => {
	const [selected, dispatch] = useReducer(
		(state, { type, ids, id }) => {
			switch (type) {
				case 'select':
					return {
						...state,
						...reduce(
							ids,
							(acc, i) => ({ ...acc, [i]: true }),
							{}
						)
					};
				case 'deselect':
					return omit(state, id);
				case 'reset':
					return {};
				default:
					return state;
			}
		},
		{}
	);
	return {
		selected,
		select: (id) => dispatch({ type: 'select', ids: [id] }),
		selectMany: (ids) => dispatch({ type: 'select', ids }),
		deselect: (id) => dispatch({ type: 'deselect', id }),
		deselectAll: () => dispatch({ type: 'reset' }),
		amountSelected: Object.keys(selected).length
	};
};

export default function MailList() {
	const history = useHistory();
	const breadcrumbs = useBreadCrumbs();
	const { convList, convMap } = useContext(ConversationFolderCtxt);
	const {
		selected,
		select,
		selectMany,
		deselect,
		deselectAll,
		amountSelected
	} = useSelection();

	return (
		<Container
			orientation="vertical"
			width="fill"
			height="fill"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			background="bg_7"
		>
			<Container
				height="48px"
				style={{ minHeight: '48px' }}
				background="bg_9"
			>
				<ListHeader
					breadCrumbs={breadcrumbs}
					actionStack={[]}
					selecting={amountSelected > 0}
					onSelectAll={() => selectMany(convList)}
					onDeselectAll={deselectAll}
					onBackClick={() => history.goBack()}
					allSelected={amountSelected === convList.length}
				/>
			</Container>
			<Divider />
			{convList.length > 0
				&& (
					<List
						Factory={({ index }) => (
							<ConversationListItem
								selecting={amountSelected > 0}
								selectable
								conversationObs={convMap[convList[index]]}
								selected={!!selected[convList[index]]}
								onSelect={() => select(convList[index])}
								onDeselect={() => deselect(convList[index])}
							/>
						)}
						amount={convList.length}
					/>
				)}
		</Container>
	);
}
