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

import { IconButton, Row, SnackbarManagerContext, Tooltip } from '@zextras/zapp-ui';
import React, { useContext, useMemo } from 'react';
import { map } from 'lodash';
import styled from 'styled-components';
import { hooks } from '@zextras/zapp-shell';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
	deleteMsg,
	editDraft,
	forwardMsg,
	moveMsgToTrash, replyAllMsg,
	replyMsg,
	setMsgFlag,
	setMsgRead,
} from '../../ui-actions/message-actions';

const ButtonBar = styled(Row)`
	position: absolute;
	right: 8px;
	top: 8px;
`;

export default function MailHoverBar({ messageId, read, flag, folderId }) {
	const dispatch = useDispatch()
	const [ t ] = useTranslation()
	const createSnackbar = useContext(SnackbarManagerContext);
	const replaceHistory = hooks.useReplaceHistoryCallback();
	const ids = useMemo(() => [messageId], [messageId]);


	const actions = useMemo(() => {
		switch (folderId) {
			case '3': // TRASH
			case '4': // JUNK - SPAM
				return [
					deleteMsg(ids, t, dispatch),
					setMsgRead(ids, read, t, dispatch),
					// archiveMsg(),
					setMsgFlag(ids, flag, t, dispatch)
				]
			case '5': // SENT
				return [
					moveMsgToTrash(ids, t, dispatch, createSnackbar),
					// archiveMsg(),
					forwardMsg(messageId, folderId, t, replaceHistory),
					setMsgFlag(ids, flag, t, dispatch)
				]
			case '6': // DRAFT
				return [
					moveMsgToTrash(ids, t, dispatch, createSnackbar),
					editDraft(messageId, folderId, t, replaceHistory),
					// archiveMsg(),
					setMsgFlag(ids, flag, t, dispatch)
				]
			// TODO: discuss about Outbox and Archive folder
			case '2':	// INBOX
			default:
				return [
					setMsgRead(ids, read, t, dispatch),
					replyMsg(messageId, folderId, t, replaceHistory),
					replyAllMsg(messageId, folderId, t, replaceHistory),
					setMsgFlag(ids, flag, t, dispatch),
					forwardMsg(messageId, folderId, t, replaceHistory),
					// archiveMsg(),
					moveMsgToTrash(ids, t, dispatch, createSnackbar),
				]
		}
	}, [folderId, ids, t, dispatch, read, flag, createSnackbar, messageId, replaceHistory]);

	return (
		<ButtonBar orientation="horizontal">
			{
				map(actions, action =>
					<Tooltip 
						key={`${messageId}-${action.icon}`}
						label={action.label}
					>
						<IconButton
							size="medium"
							icon={ action.icon }
							onClick={(ev) => {
								ev.preventDefault();
								action.action();
							}}
						/>
					</Tooltip>)
			}
		</ButtonBar>
	);
}
