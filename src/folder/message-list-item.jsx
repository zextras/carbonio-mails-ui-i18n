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
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { find, reduce, trimStart, isEmpty } from 'lodash';
import styled from 'styled-components';
import {
	Container,
	Text,
	Avatar,
	Badge,
	Row,
	Padding,
	Icon,
} from '@zextras/zapp-ui';
import { getTimeLabel } from '../commons/utils';
import { useTranslation } from 'react-i18next';
import { useFolder } from '../hooks';
import MailHoverBar from './mail-hover-bar';

const HoverContainer = styled(Container)`
	cursor: pointer;
	opacity: ${({ isHover }) => (isHover  ? 0.6 : 1)};
	mask-image: ${({ isHover }) => (isHover ? 'linear-gradient(to left, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1))' : '')};
`;

const InvisibleLink = styled(Link)`
	position: relative;
	text-decoration: none;
	width: 100%;
`;

export default function MessageListItem({
	message,
	folderId,
	conversationId
}) {
	const { t } = useTranslation();
	const [messageFolder, messageFolderLoaded] = useFolder(message.parent);
	const [avatarLabel, avatarEmail, date, participantsString] = useMemo(
		() => {
			if (message) {
				const sender = find(message.contacts, ['type', 'f']);
				return [
					sender.displayName || sender.address || '.',
					sender.address || '.',
					getTimeLabel(message.date),
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
	const [isHover, setIsHover] = useState(false);

	return (
		<InvisibleLink to={`/folder/${folderId}?conversation=${conversationId}&message=${message._id}`}>
			<HoverContainer
				background="gray6"
				mainAlignment="space-between"
				isHover={isHover}
				onMouseOver={() => setIsHover(true)}
				onMouseLeave={() => setIsHover(false)}
			>
				{ message && (
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
										{participantsString}
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
											? <Text weight={message.read ? 'regular' : 'bold'} size="large">{message.subject}</Text>
											: <Text weight={message.read ? 'regular' : 'bold'} size="large" color="secondary">{ `(${t('No Subject')})` }</Text>
									}
									{ !isEmpty(message.fragment) && (
										<Row
											takeAvailableSpace
											mainAlignment="flex-start"
											padding={{ left: 'extrasmall' }}
										>
											<Text>{` - ${message.fragment}`}</Text>
										</Row>
									)}
								</Row>
								<Row>
									{ message.urgent && (
										<Padding left="extrasmall">
											<Icon icon="ArrowUpward" color="error" />
										</Padding>
									)}
									{ messageFolderLoaded && messageFolder._id !== folderId && (
										<Padding left="small">
											<Badge value={messageFolder.name} type={message.read ? 'read' : 'unread'} />
										</Padding>
									)}
								</Row>
							</Container>
						</Row>
					</Container>
				)}
			</HoverContainer>
			{
				isHover && <Container
					onMouseEnter={() => setIsHover(true)}
					onMouseLeave={() => setIsHover(false)}
				>
					<MailHoverBar folder={messageFolder} message={message} />
				</Container>
			}
		</InvisibleLink>
	);
};
