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

import React, { useContext, useMemo } from 'react';
import { Container, Dropdown, IconButton, Padding, SnackbarManagerContext } from '@zextras/zapp-ui';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { moveToTrash } from '../actions/conversation-actions';

export default function PreviewPanelActions({ conversation, folderId }) {
	const { t } = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();

	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-end"
			crossAlignment="center"
			height="auto"
			padding={{ horizontal: 'large', vertical: 'small' }}
		>
			{/* <Padding left="extrasmall"><IconButton size="medium" icon="UndoOutline" /></Padding> */}
			{/* <Padding left="extrasmall"><IconButton size="medium" icon="ArchiveOutline" /></Padding> */}
			<Padding left="extrasmall">
				<IconButton
					size="medium"
					icon="Trash2Outline"
					onClick={() =>
						moveToTrash({
							t, createSnackbar, dispatch, ids: [conversation.id]
						})}
				/>
			</Padding>
			<Padding left="extrasmall"><IconButton size="medium" icon="PricetagsOutline" /></Padding>
			<Padding left="extrasmall">
				<Dropdown
					placement="right-end"
					items={map(
						[],
						(action) => ({
							id: action.id,
							icon: action.icon,
							label: action.label,
							click: action.onActivate
						})
					)}
				>
					<IconButton size="small" icon="MoreVertical" />
				</Dropdown>
			</Padding>
		</Container>
	);
}
