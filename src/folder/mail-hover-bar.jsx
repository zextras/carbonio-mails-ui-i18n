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

function moveToThresh(db, message) {
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

function deleteMessage(db, message) {
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

function flagUnflag(db, message) {
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

function readUnread(db, message) {
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

function archive(db, message) {
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

function forward(db, message) {
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

function edit(db, message, action) {
	return (
		<IconButton
			size="large"
			icon="Edit2Outline"
			onClick={(ev) => {
				ev.preventDefault();
				action();
			}}
		/>
	);
}

export default function MailHoverBar({ message, folder }) {
	const { db } = hooks.useAppContext();
	const replaceHistory = hooks.useReplaceHistoryCallback();

	const editMessage = () => replaceHistory(`/folder/${folder._id}?edit=${message._id}`);

	const buttons = useMemo(() => {
		switch (folder.id) {
			case '2':	// INBOX
				return (
					<>
						{moveToThresh(db, message)}
						{flagUnflag(db, message)}
						{archive(db, message)}
						{readUnread(db, message)}
					</>
				);
			case '3': // TRASH
			case '4': // JUNK - SPAM
				return (
					<>
						{deleteMessage(db, message)}
						{readUnread(db, message)}
						{archive(db, message)}
						{flagUnflag(db, message)}
					</>
				);
			case '5': // SENT
				return (
					<>
						{moveToThresh(db, message)}
						{archive(db, message)}
						{forward(db, message)}
						{flagUnflag(db, message)}
					</>
				);
			case '6': // DRAFT
				return (
					<>
						{moveToThresh(db, message)}
						{edit(db, message, editMessage)}
						{archive(db, message)}
						{flagUnflag(db, message)}
					</>
				);
				// TODO: discuss about Outbox and Archive folder
				// TODO: discuss about the default behavior (in a folder not listed)
			default:
				return (
					<>
						{moveToThresh(db, message)}
						{flagUnflag(db, message)}
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
