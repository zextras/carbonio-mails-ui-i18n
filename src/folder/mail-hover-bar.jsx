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

import { IconButton, Row } from '@zextras/zapp-ui';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { hooks } from '@zextras/zapp-shell';

const ButtonBar = styled(Row)`
	position: absolute;
	right: 8px;
	top: 8px;
`;

function MoveToTrash({ message, db }) {
	return (
		<IconButton
			size="large"
			icon="Trash2Outline"
			onClick={(ev) => {
				ev.preventDefault();
				db.moveMessageToTrash(message._id);
			}}
		/>
	);
}

function Delete({ message, db }) {
	return (
		<IconButton
			size="large"
			icon="Trash2Outline"
			onClick={(ev) => {
				ev.preventDefault();
				db.deleteMessage(message);
			}}
		/>
	);
}

function FlagUnflag({ message, db }) {
	if (message.flagged) {
		return (
			<IconButton
				size="large"
				icon="FlagOutline"
				onClick={(ev) => {
					ev.preventDefault();
					db.setFlag(message._id, false);
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
				db.setFlag(message._id, true);
			}}
		/>
	);
}

function ReadUnread({ message, db }) {
	if (message.read) {
		return (
			<IconButton
				size="large"
				icon="EmailOutline"
				onClick={(ev) => {
					ev.preventDefault();
					db.setRead(message._id, false);
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
				db.setRead(message._id, true);
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
				replaceHistory(`/folder/${folder._id}?edit=new&action=forward&actionId=${message.id}`);
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
				replaceHistory(`/folder/${folder._id}?edit=new&action=reply&actionId=${message.id}`);
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
				replaceHistory(`/folder/${folder._id}?edit=new&action=replyAll&actionId=${message.id}`);
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
				replaceHistory(`/folder/${folder._id}?edit=${message._id}`);
			}}
		/>
	);
}

export default function MailHoverBar({ message, folder }) {
	const { db } = hooks.useAppContext();

	const buttons = useMemo(() => {
		switch (folder.id) {
			case '3': // TRASH
			case '4': // JUNK - SPAM
				return (
					<>
						<Delete message={message} db={db} />
						<ReadUnread message={message} db={db} />
						<Archive message={message} db={db} />
						<FlagUnflag message={message} db={db} />
					</>
				);
			case '5': // SENT
				return (
					<>
						<MoveToTrash message={message} db={db} />
						<Archive message={message} db={db} />
						<Forward message={message} folder={folder} />
						<FlagUnflag message={message} db={db} />
					</>
				);
			case '6': // DRAFT
				return (
					<>
						<MoveToTrash message={message} db={db} />
						<Edit message={message} folder={folder} />
						<Archive message={message} db={db} />
						<FlagUnflag message={message} db={db} />
					</>
				);
			// TODO: discuss about Outbox and Archive folder
			case '2':	// INBOX
			default:
				return (
					<>
						<ReadUnread message={message} db={db} />
						<Reply message={message} folder={folder} />
						<ReplyAll message={message} folder={folder} />
						<FlagUnflag message={message} db={db} />
						<Forward message={message} folder={folder} />
						<Archive message={message} db={db} />
						<MoveToTrash message={message} db={db} />
					</>
				);
		}
	}, [db, folder.id, message._id, message.flagged, message.read]);

	return (
		<ButtonBar orientation="horizontal">
			{buttons}
		</ButtonBar>
	);
}
