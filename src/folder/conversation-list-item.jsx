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
import { useTranslation } from 'react-i18next';
import {
	find,
	reduce,
	trimStart,
	map,
	isEmpty
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
import { getTimeLabel } from '../commons/utils';

const HoverContainer = styled(Container)`
	cursor: pointer;
	&:hover{
		background: ${({ theme }) => theme.palette.highlight.regular};
	}
`;

const OuterContainer = styled(Container)`
	min-height: 70px;
`;

const CollapseElement = styled(Container)`
	display: ${({ open }) => (open ? 'block' : 'none')};
`;

export default function ConversationListItem({
	index,
	conversation,
	folderId,
	style,
	displayData,
	updateDisplayData
}) {
	const { t } = useTranslation();
	const replaceHistory = hooks.useReplaceHistoryCallback();
	const [avatarLabel, avatarEmail] = useMemo(() => {
		const sender = find(conversation.participants, ['type', 'f']);
		return [sender ? (sender.displayName || sender.address || '.', sender.address || '.') : ''];
	});
	const toggleOpen = useCallback(
		(e) => {
			e.preventDefault();
			updateDisplayData(index, conversation.id, { open: !displayData.open });
		},
		[conversation.id, displayData.open, index, updateDisplayData]
	);
	const _onClick = useCallback((e) => {
		if (!e.isDefaultPrevented()) replaceHistory(`/folder/${folderId}?conversation=${conversation._id}`);
	}, [folderId, conversation, replaceHistory]);
	const date = useMemo(
		() => getTimeLabel(conversation.date),
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
				height={69}
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="unset"
				padding={{ all: 'small' }}
				onClick={_onClick}
			>
				<div style={{ alignSelf: 'center' }}>
					<Avatar label={avatarLabel} colorLabel={avatarEmail} fallbackIcon="EmailOutline" />
				</div>
				<Row
					takeAvailableSpace
					orientation="horizontal"
					wrap="wrap"
					padding={{ left: 'large' }}
				>
					<Container orientation="horizontal" height="auto" width="fill">
						<Row
							wrap="nowrap"
							takeAvailableSpace
							mainAlignment="flex-start"
						>
							<Text
								color={conversation.read ? 'text' : 'primary'}
								size={conversation.read ? 'medium' : 'large'}
								weight={conversation.read ? 'regular' : 'bold'}
							>
								{ participantsString }
							</Text>
						</Row>
						<Row>
							{ conversation.attachment && <Padding left="small"><Icon icon="AttachOutline" /></Padding> }
							{ conversation.flagged && <Padding left="small"><Icon color="error" icon="Flag" /></Padding> }
							<Padding left="small"><Text>{ date }</Text></Padding>
						</Row>
					</Container>
					<Container orientation="horizontal" height="auto" width="fill" crossAlignment="center">
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
							takeAvailableSpace
							mainAlignment="flex-start"
							crossAlignment="baseline"
						>
							{
								conversation.subject
									? <Text weight={conversation.read ? 'regular' : 'bold'} size="large">{conversation.subject}</Text>
									: <Text weight={conversation.read ? 'regular' : 'bold'} size="large" color="secondary">{ `(${t('No Subject')})` }</Text>
							}
							{ !isEmpty(conversation.fragment) && (
								<Row
									takeAvailableSpace
									mainAlignment="flex-start"
									padding={{ left: 'extrasmall' }}
								>
									<Text>{` - ${conversation.fragment}`}</Text>
								</Row>
							)}
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
			{ conversation.msgCount > 1
				&& (
					<CollapseElement
						open={displayData.open}
					>
						{ displayData.open && (
							<Container padding={{ left: 'extralarge' }} height="auto">
								<ConversationMessagesList
									folderId={folderId}
									conversationId={conversation._id}
									convMessages={conversation.messages}
								/>
							</Container>
						)}
					</CollapseElement>
				)}
			<Divider style={{ minHeight: '1px' }} />
		</OuterContainer>
	);
};

const ConversationMessagesList = ({ conversationId, convMessages, folderId }) => {
	const ids = useMemo(() => map(convMessages, (m) => m.id), [convMessages]);

	const [messages, loaded] = useConversationMessages(ids);

	return (
		<>
			{loaded
			&& map(
				messages,
				(message, index) => (
					<React.Fragment key={message.id}>
						<MessageListItem
							message={message}
							conversationId={conversationId}
							folderId={folderId}
						/>
						{ (messages.length - 1) > index && <Divider /> }
					</React.Fragment>
				)
			)}
		</>
	);
};
