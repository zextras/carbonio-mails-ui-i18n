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
import React, {
	useCallback, useMemo, useEffect, useState
} from 'react';
import { useTranslation } from 'react-i18next';
import {
	find, isEmpty, reduce, trimStart
} from 'lodash';
import styled from 'styled-components';
import { hooks } from '@zextras/zapp-shell';
import {
	Avatar, Badge, Container, Divider, Icon, IconButton, Padding, Row, Text
} from '@zextras/zapp-ui';
import { useDispatch, useSelector } from 'react-redux';
import MessageListItem from './message-list-item';
import { getTimeLabel, participantToString } from '../commons/utils';
import { searchConv } from '../store/conversations-slice';

export default function ConversationListItem({
	index, conversation, folderId, style, displayData, updateDisplayData,
}) {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const replaceHistory = hooks.useReplaceHistoryCallback();
	const accounts = hooks.useUserAccounts();
	const isConversation = conversation.msgCount > 1;
	const [avatarLabel, avatarEmail] = useMemo(() => {
		const sender = find(conversation.participants, ['type', 'f']);
		return [sender ? (sender.displayName || sender.address || '.', sender.address || '.') : ''];
	}, [conversation.participants]);
	const toggleOpen = useCallback(
		(e) => {
			e.preventDefault();
			if (isConversation) updateDisplayData(index, conversation.id, { open: !displayData.open });
		},
		[conversation.id, displayData.open, index, updateDisplayData, isConversation],
	);

	const _onClick = useCallback((e) => {
		if (!e.isDefaultPrevented()) {
			dispatch(searchConv({ conversationId: conversation.id, folderId }));
			replaceHistory(`/folder/${folderId}?conversation=${conversation.id}`);
		}
	}, [conversation.id, folderId, replaceHistory]);
	const date = useMemo(
		() => getTimeLabel(conversation.date),
		[conversation.date],
	);
	const participantsString = useMemo(() => reduce(
		conversation.participants,
		(acc, part) => trimStart(`${acc}, ${participantToString(part, t, accounts)}`, ', '),
		'',
	), [conversation.participants, t, accounts]);

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
						) }
						<Row
							wrap="nowrap"
							takeAvailableSpace
							mainAlignment="flex-start"
							crossAlignment="baseline"
						>
							{
								conversation.subject
									? <Text weight={conversation.read ? 'regular' : 'bold'} size="large">{ conversation.subject }</Text>
									: (
										<Text
											weight={conversation.read ? 'regular' : 'bold'}
											size="large"
											color="secondary"
										>
											{ `(${t('No Subject')})` }
										</Text>
									)
							}
							{ !isEmpty(conversation.fragment) && (
								<Row
									takeAvailableSpace
									mainAlignment="flex-start"
									padding={{ left: 'extrasmall' }}
								>
									<Text>{ ` - ${conversation.fragment}` }</Text>
								</Row>
							) }
						</Row>
						<Row>
							{ conversation.urgent && <Icon icon="ArrowUpward" color="error" /> }
							{ isConversation
							&& (
								<IconButton
									size="small"
									icon={displayData.open ? 'ArrowIosUpward' : 'ArrowIosDownward'}
									onClick={toggleOpen}
								/>
							) }
						</Row>
					</Container>
				</Row>
			</HoverContainer>
			{ isConversation && displayData.open
			&& (
				<CollapseElement
					open={displayData.open}
					padding={{ left: 'extralarge' }}
					height="auto"
				>
					<Container padding={{ left: 'extralarge' }} height="auto">
						<ConversationMessagesList
							folderId={folderId}
							conversation={conversation}
						/>
					</Container>
				</CollapseElement>
			)}

			<Divider style={{ minHeight: '1px' }} />
		</OuterContainer>
	);
}

function ConversationMessagesList({ conversation, folderId }) {
	const dispatch = useDispatch();

	useEffect(() => {
		dispatch(searchConv({ folderId, conversationId: conversation.id }));
	}, [conversation.id, folderId]);

	if (!conversation.messages[0].subject) return null;

	return (
		<>
			{conversation.messages.map((message, index) => (
				<React.Fragment key={message.id}>
					<MessageListItem
						message={message}
						conversation={conversation}
						folderId={folderId}
					/>
					{ (conversation.messages.length - 1) > index && <Divider /> }
				</React.Fragment>
			)) }
		</>
	);
}

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
