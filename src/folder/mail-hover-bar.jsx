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

function MoveToThrash({ message }) {
	const { db } = hooks.useAppContext();

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

function Delete({ message }) {
	const { db } = hooks.useAppContext();
	return (
		<IconButton
			size="large"
			icon="Trash2Outline"
			onClick={(ev) => {
				ev.preventDefault();
				db.deleteMessage(message._id);
			}}
		/>
	);
}

function FlagUnflag({ message }) {
	const { db } = hooks.useAppContext();
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

function ReadUnread({ message }) {
	const { db } = hooks.useAppContext();
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
	return <div />;
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

function Forward({ message }) {
	return <div />;
	// return (
	// 	<IconButton
	// 		size="large"
	// 		icon="Forward"
	// 		onClick={(ev) => {
	// 			ev.preventDefault();
	// 			// TODO: forward
	// 		}}
	// 	/>
	// );
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
			case '2':	// INBOX
				return (
					<>
						<MoveToThrash message={message} />
						<FlagUnflag message={message} />
						<Archive message={message} />
						<ReadUnread message={message} />
					</>
				);
			case '3': // TRASH
			case '4': // JUNK - SPAM
				return (
					<>
						<Delete message={message} />
						<ReadUnread message={message} />
						<Archive message={message} />
						<FlagUnflag message={message} />
					</>
				);
			case '5': // SENT
				return (
					<>
						<MoveToThrash message={message} />
						<Archive message={message} />
						<Forward message={message} />
						<FlagUnflag message={message} />
					</>
				);
			case '6': // DRAFT
				return (
					<>
						<MoveToThrash message={message} />
						<Edit message={message} folder={folder} />
						<Archive message={message} />
						<FlagUnflag message={message} />
					</>
				);
				// TODO: discuss about Outbox and Archive folder
				// TODO: discuss about the default behavior (in a folder not listed)
			default:
				return (
					<>
						<MoveToThrash message={message} />
						<FlagUnflag message={message} />
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
