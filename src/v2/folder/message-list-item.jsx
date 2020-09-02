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
import { Link } from 'react-router-dom';
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
import { hooks } from '@zextras/zapp-shell';

const HoverContainer = styled(Container)`
	cursor: pointer;
	&:hover{
		background: ${({ theme }) => theme.palette.highlight.regular};
	}
`;
const InvisibleLink = styled(Link)`
	text-decoration: none;
	width: 100%;
`;

export default function MessageListItem({
	message,
	folderId,
	conversationId
}) {
	const { db } = hooks.useAppContext();
	const [avatarLabel, avatarEmail, date, participantsString] = useMemo(
		() => {
			if (message) {
				const sender = find(message.contacts, ['type', 'f']);
				return [
					sender.displayName || sender.address || '.',
					sender.address || '.',
					moment(message.date).format('lll'),
					reduce(
						message.contacts,
						(acc, part) => trimStart(`${acc}, ${part.displayName || part.address}`, ', '),
						''
					)
				];
			}
			return [
				'.',
				'.',
				'',
				''
			];
		},
		[message]
	);

	return (
		<InvisibleLink to={`/folder/${folderId}?conversation=${conversationId}&message=${message._id}`}>
			<HoverContainer
				background="gray6"
				mainAlignment="space-between"
			>
				{ message && (
					<Container
						height={56}
						orientation="horizontal"
						mainAlignment="flex-start"
						padding={{ all: 'small' }}
					>
						<Avatar label={avatarLabel} colorLabel={avatarEmail} fallbackIcon="EmailOutline" />
						<Row
							orientation="vertical"
							padding={{ left: 'small' }}
							takeAvailableSpace={true}
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
						</Row>
					</Container>
				)}
				<Divider />
			</HoverContainer>
		</InvisibleLink>
	);
};
