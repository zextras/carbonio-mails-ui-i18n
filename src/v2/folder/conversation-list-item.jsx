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
import React, { useCallback, useMemo } from 'react';
import moment from 'moment';
import {
	find,
	reduce,
	trimStart,
	map
} from 'lodash';
import styled from 'styled-components';
import {
	Container,
	Text,
	Divider,
	Avatar,
	Row,
	Badge,
	Padding,
	Icon,
	IconButton,
	Collapse
} from '@zextras/zapp-ui';
import MessageListItem from './message-list-item';
import { useConversationMessages } from '../hooks';

const HoverContainer = styled(Container)`
	cursor: pointer;
	&:hover{
		background: ${({ theme }) => theme.palette.highlight.regular};
	}
`;

const OuterContainer = styled(Container)`
	min-height: 57px;
`;

export default function ConversationListItem({
	index,
	conversation,
	style,
	displayData,
	updateDisplayData
}) {
	const avatarLabel = useMemo(() => {
		const sender = find(conversation.participants, ['type', 'f']);
		return sender.displayName || sender.address || '.';
	});
	const toggleOpen = useCallback(
		() => updateDisplayData(index, conversation.id, { open: !displayData.open }),
		[conversation.id, displayData.open, updateDisplayData]
	);
	const date = useMemo(
		() => moment(conversation.date).format('lll'),
		[conversation.date]
	);

	const participantsString = useMemo(() => reduce(
		conversation.participants,
		(acc, part) => trimStart(`${acc}, ${part.displayName || part.address}`, ', '),
		''
	),
	[conversation.participants]);
	const { messages, loaded } = useConversationMessages(conversation.id);
	return (
		<OuterContainer
			style={style}
			background="gray6"
			mainAlignment="flex-start"
		>
			<HoverContainer
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
							<Text color={conversation.read ? 'text' : 'primary'} size="large" weight={conversation.read ? 'regular' : 'bold'}>{participantsString}</Text>
						</Row>
						<Row>
							{ conversation.attachment
							&& (
								<Padding right="extrasmall">
									<Icon icon="AttachOutline" />
								</Padding>
							)}
							{ conversation.flagged
							&& (
								<Padding right="extrasmall">
									<Icon icon="Flag" color="error" />
								</Padding>
							)}
							<Text>{date}</Text>
						</Row>
					</Container>
					<Container orientation="horizontal" width="fill" crossAlignment="center">
						<Row>
							<Padding right="extrasmall">
								<Badge value={conversation.msgCount} type={conversation.read ? 'read' : 'unread'} />
							</Padding>
						</Row>
						<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start" crossAlignment="baseline">
							<Text weight={conversation.read ? 'regular' : 'bold'} size="large">{conversation.subject}</Text>
							<Text>{` - ${conversation.fragment}`}</Text>
						</Row>
						<Row>
							{ conversation.urgent
								&& <Icon icon="ArrowUpward" color="error" />}
							{ conversation.msgCount > 0
								&& (
									<IconButton
										size="small"
										icon={displayData.open
											? 'ArrowIosUpward'
											: 'ArrowIosDownward'}
										onClick={toggleOpen}
									/>
								)}
						</Row>
					</Container>
				</Container>
			</HoverContainer>
			<Divider style={{ minHeight: '1px' }} />
			<Collapse
				orientation="vertical"
				crossSize="100%"
				disableTransition
				open={displayData.open}
			>
				<Container
					height={conversation.msgCount * 57}
					padding={{ left: 'large' }}
				>
					{loaded
						&& map(
							messages,
							(message) => <MessageListItem key={message.id} message={message} />
						)}
				</Container>
			</Collapse>
		</OuterContainer>
	);
};
