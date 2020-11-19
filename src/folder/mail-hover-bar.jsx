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

import { IconButton, Row, SnackbarManagerContext } from '@zextras/zapp-ui';
import React, { useContext, useMemo } from 'react';
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
} from '../actions/message-actions';

const ButtonBar = styled(Row)`
	position: absolute;
	right: 8px;
	top: 8px;
`;

export default function MailHoverBar({ messageId, read, flag, folderId }) {
	const dispatch = useDispatch()
	const { t } = useTranslation()
	const createSnackbar = useContext(SnackbarManagerContext);
	const replaceHistory = hooks.useReplaceHistoryCallback();


	const actions = useMemo(() => {
		switch (folderId) {
			case '3': // TRASH
			case '4': // JUNK - SPAM
				return [
					deleteMsg({ dispatch, t, messageId}),
					setMsgRead({ dispatch, t, value: read, messageId}),
					// archiveMsg(),
					setMsgFlag({ dispatch, t, messageId, value: flag })
				]
			case '5': // SENT
				return [
					moveMsgToTrash({ dispatch, t, messageId, createSnackbar }),
					// archiveMsg(),
					forwardMsg({ replaceHistory, t, folderId, messageId}),
					setMsgFlag({ dispatch, t, messageId, value: flag })
				]
			case '6': // DRAFT
				return [
					moveMsgToTrash({ dispatch, messageId, createSnackbar, t}),
					editDraft({ replaceHistory, t, messageId, folderId }),
					// archiveMsg(),
					setMsgFlag({ dispatch, t, messageId, value: flag })
				]
			// TODO: discuss about Outbox and Archive folder
			case '2':	// INBOX
			default:
				return [
					setMsgRead({ dispatch, t, value: read, messageId}),
					replyMsg({ replaceHistory, t, messageId, folderId }),
					replyAllMsg({ replaceHistory, t, messageId, folderId }),
					setMsgFlag({ dispatch, t, messageId, value: flag }),
					forwardMsg({ replaceHistory, t, folderId, messageId}),
					// archiveMsg(),
					moveMsgToTrash({ dispatch, messageId, createSnackbar, t}),
				]
		}
	}, [dispatch, folderId, messageId, flag, read]);

	return (
		<ButtonBar orientation="horizontal">
			{
				actions.map(action => 
					<IconButton
						key={`${messageId}-${action.icon}`}
						size="large"
						icon={ action.icon }
						onClick={(ev) => {
							ev.preventDefault();
							action.action();
						}}
					/>)
			}
		</ButtonBar>
	);
}
