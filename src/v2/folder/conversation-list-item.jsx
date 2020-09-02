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
import { hooks } from '@zextras/zapp-shell';
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
	folderId,
	style,
	displayData,
	updateDisplayData
}) {
	const replaceHistory = hooks.useReplaceHistoryCallback();
	const [avatarLabel, avatarEmail] = useMemo(() => {
		const sender = find(conversation.participants, ['type', 'f']);
		return [sender.displayName || sender.address || '.', sender.address || '.'];
	});
	const toggleOpen = useCallback(
		(e) => {
			e.preventDefault();
			updateDisplayData(index, conversation.id, { open: !displayData.open });
		},
		[conversation.id, displayData.open, updateDisplayData]
	);
	const _onClick = useCallback((e) => {
		if (!e.isDefaultPrevented()) replaceHistory(`/folder/${folderId}?conversation=${conversation._id}`);
	}, [folderId, conversation, replaceHistory]);
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
				onClick={_onClick}
			>
				<Avatar label={avatarLabel} colorLabel={avatarEmail} fallbackIcon="EmailOutline" />
				<Row
					takeAvailableSpace={true}
					orientation="vertical"
					padding={{ left: 'small' }}
				>
					<Container orientation="horizontal" width="fill">
						<Row
							wrap="nowrap"
							takeAvailableSpace={true}
							mainAlignment="flex-start"
						>
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
						{ conversation.msgCount > 1
							&& (
								<Row>
									<Padding right="extrasmall">
										<Badge value={conversation.msgCount} type={conversation.read ? 'read' : 'unread'} />
									</Padding>
								</Row>
							)}
						<Row
							wrap="nowrap"
							takeAvailableSpace={true}
							mainAlignment="flex-start"
							crossAlignment="baseline"
						>
							<Text weight={conversation.read ? 'regular' : 'bold'} size="large">{conversation.subject}</Text>
							<Text>{` - ${conversation.fragment}`}</Text>
						</Row>
						<Row>
							{ conversation.urgent
								&& <Icon icon="ArrowUpward" color="error" />}
							{ conversation.msgCount > 1
								&& (
									<IconButton
										size="small"
										icon={displayData.open ? 'ArrowIosUpward' : 'ArrowIosDownward'}
										onClick={toggleOpen}
									/>
								)}
						</Row>
					</Container>
				</Row>
			</HoverContainer>
			<Divider style={{ minHeight: '1px' }} />
			{ conversation.msgCount > 1
				&& (
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
							<ConversationMessagesList
								folderId={folderId}
								conversationId={conversation.id}
								conversationDexieId={conversation._id}
							/>
						</Container>
					</Collapse>
			)}
		</OuterContainer>
	);
};

const ConversationMessagesList = ({ conversationId, conversationDexieId, folderId }) => {
	const { messages, loaded } = useConversationMessages(conversationId);

	return (
		<>
			{loaded
			&& map(
				messages,
				(message) => <MessageListItem key={message.id} message={message} conversationId={conversationDexieId} folderId={folderId} />
			)}
		</>
	);
};
