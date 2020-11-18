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
import { moveMsgToTrash, setMsgFlag, setMsgRead } from '../actions/message-actions';

const ButtonBar = styled(Row)`
	position: absolute;
	right: 8px;
	top: 8px;
`;

function MoveToTrash({ message, dispatch }) {
	const { t } = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);

	return (
		<IconButton
			size="large"
			icon="Trash2Outline"
			onClick={(ev) => {
				ev.preventDefault();
				moveMsgToTrash({ dispatch, msgId: message.id, t, createSnackbar })
			}}
		/>
	);
}

function Delete({ message, dispatch }) {
	return (
		<IconButton
			size="large"
			icon="Trash2Outline"
			onClick={(ev) => {
				ev.preventDefault();
				console.log('TODO');
			}}
		/>
	);
}

function FlagUnflag({ message, dispatch }) {
	if (message.flagged) {
		return (
			<IconButton
				size="large"
				icon="FlagOutline"
				onClick={(ev) => {
					ev.preventDefault();
					setMsgFlag({ dispatch, msgId: message.id, value: false });
				}}
			/>
		);
	}
	return (
		<IconButton
			size="large"
			icon="Flag"
			onClick={(ev) => {
				ev.preventDefault();
				setMsgFlag({ dispatch, msgId: message.id, value: true });
			}}
		/>
	);
}

function ReadUnread({ message, dispatch }) {
	if (message.read) {
		return (
			<IconButton
				size="large"
				icon="EmailOutline"
				onClick={(ev) => {
					ev.preventDefault();
					setMsgRead({ dispatch, msgId: message.id, value: false });
				}}
			/>
		);
	}
	return (
		<IconButton
			size="large"
			icon="EmailReadOutline"
			onClick={(ev) => {
				ev.preventDefault();
				setMsgRead({ dispatch, msgId: message.id, value: true });
			}}
		/>
	);
}

function Archive({ message }) {
	return null;
	// return (
	// 	<IconButton
	// 		size="large"
	// 		icon="ArchiveOutline"
	// 		onClick={(ev) => {
	// 			ev.preventDefault();
	// 			// TODO: archive; in future, when it will be defined
	// 		}}
	// 	/>
	// );
}

function Forward({ message, folder }) {
	const replaceHistory = hooks.useReplaceHistoryCallback();

	return (
		<IconButton
			size="large"
			icon="Forward"
			onClick={(ev) => {
				ev.preventDefault();
				replaceHistory(`/folder/${folder.id}?edit=new&action=forward&actionId=${message.id}`);
			}}
		/>
	);
}

function Reply({ message, folder }) {
	const replaceHistory = hooks.useReplaceHistoryCallback();

	return (
		<IconButton
			size="large"
			icon="UndoOutline"
			onClick={(ev) => {
				ev.preventDefault();
				replaceHistory(`/folder/${folder.id}?edit=new&action=reply&actionId=${message.id}`);
			}}
		/>
	);
}

function ReplyAll({ message, folder }) {
	const replaceHistory = hooks.useReplaceHistoryCallback();

	return (
		<IconButton
			size="large"
			icon="ReplyAll"
			onClick={(ev) => {
				ev.preventDefault();
				replaceHistory(`/folder/${folder.id}?edit=new&action=replyAll&actionId=${message.id}`);
			}}
		/>
	);
}

function Edit({ message, folder }) {
	const replaceHistory = hooks.useReplaceHistoryCallback();

	return (
		<IconButton
			size="large"
			icon="Edit2Outline"
			onClick={(ev) => {
				ev.preventDefault();
				replaceHistory(`/folder/${folder.id}?edit=${message._id}`);
			}}
		/>
	);
}

export default function MailHoverBar({ message, folder }) {
	const dispatch = useDispatch();

	const buttons = useMemo(() => {
		switch (folder.id) {
			case '3': // TRASH
			case '4': // JUNK - SPAM
				return (
					<>
						<Delete message={message} dispatch={dispatch} />
						<ReadUnread message={message} dispatch={dispatch} />
						<Archive message={message} dispatch={dispatch} />
						<FlagUnflag message={message} dispatch={dispatch} />
					</>
				);
			case '5': // SENT
				return (
					<>
						<MoveToTrash message={message} dispatch={dispatch} />
						<Archive message={message} dispatch={dispatch} />
						<Forward message={message} folder={folder} />
						<FlagUnflag message={message} dispatch={dispatch} />
					</>
				);
			case '6': // DRAFT
				return (
					<>
						<MoveToTrash message={message} dispatch={dispatch} />
						<Edit message={message} folder={folder} />
						<Archive message={message} dispatch={dispatch} />
						<FlagUnflag message={message} dispatch={dispatch} />
					</>
				);
			// TODO: discuss about Outbox and Archive folder
			case '2':	// INBOX
			default:
				return (
					<>
						<ReadUnread message={message} dispatch={dispatch} />
						<Reply message={message} folder={folder} />
						<ReplyAll message={message} folder={folder} />
						<FlagUnflag message={message} dispatch={dispatch} />
						<Forward message={message} folder={folder} />
						<Archive message={message} dispatch={dispatch} />
						<MoveToTrash message={message} dispatch={dispatch} />
					</>
				);
		}
	}, [dispatch, folder, message]);

	return (
		<ButtonBar orientation="horizontal">
			{buttons}
		</ButtonBar>
	);
}
