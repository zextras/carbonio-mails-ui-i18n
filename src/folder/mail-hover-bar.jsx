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
	return;
	return (
		<IconButton
			size="large"
			icon="ArchiveOutline"
			onClick={(ev) => {
				ev.preventDefault();
				// TODO: archive; in future, when it will be defined
			}}
		/>
	);
}

export default function MailHoverBar({ message, folder }) {
	const { db } = hooks.useAppContext();
	const buttons = useMemo(() => {
		switch (folder.id) {
			case '2': {
				return (
					<>
						{
							moveToThresh(db, message)
						}
						{
							flagUnflag(db, message)
						}
						{
							archive(db, message)
						}
						{
							readUnread(db, message)
						}
					</>
				);
			}
			case '3': {
				return (
					<>
						{
							deleteMessage(db, message)
						}
						{
							flagUnflag(db, message)
						}
					</>
				);
			}
			default: {
				return (
					<>
						{
							moveToThresh(db, message)
						}
						{
							flagUnflag(db, message)
						}
					</>
				);
			}
		}
	}, [db, folder.id, message._id, message.flagged, message.read]);

	return (
		<ButtonBar orientation="horizontal">
			{buttons}
		</ButtonBar>
	);
}
