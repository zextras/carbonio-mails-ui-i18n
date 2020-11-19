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
import { hooks } from '@zextras/zapp-shell';
import { moveConversationToTrash, setConversationsFlag, setConversationsRead } from '../actions/conversation-actions';
import { replyAllMsg, replyMsg } from '../actions/message-actions';

export default function PreviewPanelActions({conversation, folderId}) {
	const {t} = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const replaceHistory = hooks.useReplaceHistoryCallback();

	const ids = [conversation.id];

	const primaryActions = useMemo(() => {
		switch (folderId) {
			case '5': // SENT
				return [
					moveConversationToTrash(ids, t, dispatch, createSnackbar),
				]
			case '3': // TRASH
			case '4': // JUNK
				return [
					// TODO: deleteConversation
				];
			case '2':
			default:
				return [
					replyMsg(conversation.messages[0].id, folderId, t, replaceHistory),
					moveConversationToTrash(ids, t, dispatch, createSnackbar),
					// archiveMsg
					// editTagsMsg
				];
		}
	}, [conversation, folderId]);

	const secondaryActions = useMemo(() => {
		switch (folderId) {
			case '5': // SENT
				return [
					setConversationsFlag(ids, conversation.flagged, t, dispatch),
				]
			case '3': // TRASH
			case '4': // JUNK
				return [
					setConversationsRead(ids, conversation.read, t, dispatch),
					setConversationsFlag(ids, conversation.flagged, t, dispatch),
				];
			default :
			case '2': // INBOX
				return [
					replyAllMsg(conversation.messages[0].id, folderId, t, replaceHistory),
					setConversationsRead(ids, conversation.read, t, dispatch),
					setConversationsFlag(ids, conversation.flagged, t, dispatch),
					// archiveMsg
					// editTagsMsg
				];
		}
	}, [conversation, folderId, conversation.flagged, conversation.read]);


	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-end"
			crossAlignment="center"
			height="auto"
			padding={ {horizontal: 'large', vertical: 'small'} }
		>
			{
				primaryActions.map(action => (
					<Padding left="extrasmall" key={ action.label }>
						<IconButton
							size="medium"
							icon={ action.icon }
							onClick={ (ev) => {
								if (ev) ev.preventDefault();
								action.action();
							}
							}
						/>
					</Padding>
				))
			}
			<Padding left="extrasmall">
				<Dropdown
					placement="right-end"
					items={ map(
						secondaryActions,
						(action) => ({
							id: action.label,
							icon: action.icon,
							label: action.label,
							click: (ev) => {
								if (ev) ev.preventDefault();
								action.action();
							}
						})
					) }
				>
					<IconButton size="medium" icon="MoreVertical"/>
				</Dropdown>
			</Padding>
		</Container>
	);
}
