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
import React, { useMemo } from 'react';
import moment from 'moment';
import { find, reduce, trimStart } from 'lodash';
import styled from 'styled-components';
import {
	Container,
	Text,
	Divider,
	Avatar,
	Row,
	Padding,
	Icon,
} from '@zextras/zapp-ui';

const HoverContainer = styled(Container)`
	cursor: pointer;
	&:hover{
		background: ${({ theme }) => theme.palette.highlight.regular};
	}
`;

export default function MessageListItem({
	messageInfo,
}) {
	const message = useMemo(() => ({
		id: Math.random() * 200,
		_id: '_id',
		parent: Math.floor(Math.random() * 10),
		date: Math.floor(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365),
		participants: [
			{
				type: 'f',
				address: 'adderss1@boh.com',
				displayName: 'participant 0 sender'
			},
			{
				type: 't',
				address: 'address2@boh.com',
				displayName: 'recipient'
			},
			{
				type: 'c',
				address: 'address3@boh.com',
				displayName: 'participant 1 cc'
			}
		],
		subject: 'subject',
		fragment: 'fragment',
		read: Math.random() > 0.5,
		attachment: Math.random() > 0.5,
		flagged: Math.random() > 0.5,
		urgent: Math.random() > 0.5,
	}));
	const avatarLabel = useMemo(() => {
		const sender = find(message.participants, ['type', 'f']);
		return sender.displayName || sender.address || '.';
	});
	const date = useMemo(
		() => moment(message.date).format('lll'),
		[message.date]
	);

	const participantsString = useMemo(() => reduce(
		message.participants,
		(acc, part) => trimStart(`${acc}, ${part.displayName || part.address}`, ', '),
		''
		),
		[message.participants]);
	return (
		<HoverContainer
			background="gray6"
			mainAlignment="space-between"
		>
			<Container
				height={56}
				orientation="horizontal"
				mainAlignment="flex-start"
				padding={{ all: 'small' }}
			>
				<Avatar label={avatarLabel} fallbackIcon="EmailOutline" />
				<Container
					orientation="vertical"
					padding={{ left: 'small' }}
				>
					<Container orientation="horizontal" width="fill">
						<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
							<Text
								color={message.read ? 'text' : 'primary'}
								size="large"
								weight={message.read ? 'regular' : 'bold'}
							>
								{participantsString}
							</Text>
						</Row>
						<Row>
							{ message.attachment
							&& (
								<Padding right="extrasmall">
									<Icon icon="AttachOutline" />
								</Padding>
							)}
							{ message.flagged
							&& (
								<Padding right="extrasmall">
									<Icon icon="Flag" color="error" />
								</Padding>
							)}
							<Text>{date}</Text>
						</Row>
					</Container>
					<Container orientation="horizontal" width="fill" crossAlignment="center">
						<Row
							wrap="nowrap"
							takeAvailableSpace
							mainAlignment="flex-start"
							crossAlignment="baseline"
						>
							<Text weight={message.read ? 'regular' : 'bold'} size="large">{message.subject}</Text>
							<Text>{` - ${message.fragment}`}</Text>
						</Row>
						<Row>
							{ message.urgent
							&& <Icon icon="ArrowUpward" color="error" />}
						</Row>
					</Container>
				</Container>
			</Container>
			<Divider />
		</HoverContainer>
	);
};
