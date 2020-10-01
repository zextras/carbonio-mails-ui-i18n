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

export default function MailHoverBar({ message, folder }) {
	const { db } = hooks.useAppContext();
	const buttons = useMemo(() => {
		switch (folder.id) {
			case '2': {
				return (
					<>
						<IconButton
							size="large"
							icon="Trash2Outline"
							onClick={() => {}}
						/>
						{message.flagged
							? (
								<IconButton
									size="large"
									icon="FlagOutline"
									onClick={() => {
										db.setFlag(message._id, false);
									}}
								/>
							)
							: (
								<IconButton
									size="large"
									icon="Flag"
									onClick={() => {
										db.setFlag(message._id, true);
									}}
								/>
							)}
					</>
				);
			}
			default: {
				return (
					<>
						<IconButton
							size="large"
							icon="Trash2Outline"
							onClick={() => {
								alert('ciao');
							}}
						/>
						{message.flagged
							? (
								<IconButton
									size="large"
									icon="FlagOutline"
									onClick={(ev) => {
										ev.stopPropagation();
										db.setFlag(message._id, false);
									}}
								/>
							)
							: (
								<IconButton
									size="large"
									icon="Flag"
									onClick={(ev) => {
										ev.stopPropagation();
										db.setFlag(message._id, true);
									}}
								/>
							)}
					</>
				);
			}
		}
	}, [db, folder.id, message._id, message.flagged]);

	return (
		<ButtonBar orientation="horizontal">
			{buttons}
		</ButtonBar>
	);
}
