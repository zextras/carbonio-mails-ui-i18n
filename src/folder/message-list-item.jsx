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
import { find, isEmpty, reduce, trimStart } from 'lodash';
import styled from 'styled-components';
import { hooks } from '@zextras/zapp-shell';
import { Avatar, Badge, Container, Icon, Padding, Row, Text } from '@zextras/zapp-ui';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { getTimeLabel, participantToString } from '../commons/utils';
import MailHoverBar from './mail-hover-bar';
import { selectFolders } from '../store/folders-slice';

const HoverBarContainer = styled(Container)`
	display: none;
`;

const HoverContainer = styled(Container)`
	cursor: pointer;
`;

const InvisibleLink = styled(Link)`
	position: relative;
	text-decoration: none;
	width: 100%;
	&:hover{
		& ${HoverBarContainer} {
				display: flex;
			}
			
		& ${HoverContainer} {
				opacity:  0.6;
				mask-image: linear-gradient(to left, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
			}
	}
`;

export default function MessageListItem({ message, folderId, conversation }) {
	const { t } = useTranslation();
	const accounts = hooks.useUserAccounts();
	console.log('Rendede message');

	const messageFolder = useSelector(selectFolders)[message.parent];
	const [avatarLabel, avatarEmail, date, participantsString] = useMemo(
		() => {
			if (message) {
				const sender = find(message.participants, ['type', 'f']);
				return [
					sender.fullName || sender.address || '.',
					sender.address || '.',
					getTimeLabel(moment(message.date)),
					reduce(
						message.participants,
						(acc, part) => trimStart(`${acc}, ${participantToString(part, t, accounts)}`, ', '),
						'',
					),
				];
			}
			return [
				'.',
				'.',
				'',
				'',
			];
		},
		[message, t, accounts],
	);

	return (
		<InvisibleLink to={`/folder/${folderId}?conversation=${conversation.id}&message=${message.id}`}>
			<HoverContainer
				background="gray6"
				mainAlignment="space-between"
			>
				<Container
					height={69}
					orientation="horizontal"
					mainAlignment="flex-start"
					crossAlignment="unset"
					padding={{ all: 'small' }}
				>
					<div style={{ alignSelf: 'center' }}>
						<Avatar label={avatarLabel} colorLabel={avatarEmail} fallbackIcon="EmailOutline" />
					</div>
					<Row
						wrap="wrap"
						orientation="horizontal"
						padding={{ left: 'large' }}
						height="auto"
						takeAvailableSpace
					>
						<Container orientation="horizontal" height="auto" width="fill">
							<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
								<Text
									color={message.read ? 'text' : 'primary'}
									size={message.read ? 'medium' : 'large'}
									weight={message.read ? 'regular' : 'bold'}
								>
									{ participantsString }
								</Text>
							</Row>
							<Row>
								{ message.attachment && <Padding left="small"><Icon icon="AttachOutline" /></Padding> }
								{ message.flagged && <Padding left="small"><Icon color="error" icon="Flag" /></Padding> }
								<Padding left="small"><Text>{ date }</Text></Padding>
							</Row>
						</Container>
						<Container orientation="horizontal" height="auto" width="fill" crossAlignment="center">
							<Row
								wrap="nowrap"
								takeAvailableSpace
								mainAlignment="flex-start"
								crossAlignment="baseline"
							>
								{
									message.subject
										? <Text weight={message.read ? 'regular' : 'bold'} size="large">{ message.subject }</Text>
										: (
											<Text
												weight={message.read ? 'regular' : 'bold'}
												size="large"
												color="secondary"
											>
												{ `(${t('No Subject')})` }
											</Text>
										)
								}
								{ !isEmpty(message.fragment) && (
									<Row
										takeAvailableSpace
										mainAlignment="flex-start"
										padding={{ left: 'extrasmall' }}
									>
										<Text>{ ` - ${message.fragment}` }</Text>
									</Row>
								) }
							</Row>
							<Row>
								{ message.urgent && (
									<Padding left="extrasmall">
										<Icon icon="ArrowUpward" color="error" />
									</Padding>
								) }
								{ messageFolder && messageFolder.id !== folderId && (
									<Padding left="small">
										<Badge value={messageFolder.name} type={message.read ? 'read' : 'unread'} />
									</Padding>
								) }
							</Row>
						</Container>
					</Row>
				</Container>
			</HoverContainer>
			<HoverBarContainer>
				<MailHoverBar folderId={folderId} messageId={message.id} flag={message.flagged} read={message.read} />
			</HoverBarContainer>
		</InvisibleLink>
	);
}
