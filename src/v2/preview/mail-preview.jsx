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

import React, { useLayoutEffect, useMemo, useState, useRef } from 'react';
import styled from 'styled-components';
import { find, map, reduce, filter } from 'lodash';
import { Link } from 'react-router-dom';
import moment from 'moment';
import {
	Container,
	Text,
	Avatar,
	Divider,
	Collapse,
	Icon,
	Padding,
	Badge,
	DownloadFileButton,
	IconButton,
	Row,
	Dropdown
} from '@zextras/zapp-ui';

import { useMessage } from '../hooks';
import useQueryParam from '../hooks/useQueryParam';
import MailMessageRenderer from '../commons/mail-message-renderer';

const HoverContainer = styled(Container)`
	cursor: pointer;
	&:hover{
		background: ${({ theme }) => theme.palette.highlight.regular};
	}
`;

const findAttachments = (parts, acc) => reduce(
	parts,
	(found, part) => {
		if (part.disposition === 'attachment') {
			found.push(part);
		}
		return findAttachments(part.parts, found);
	},
	acc
);

const StyledDownloadFileButton = styled(DownloadFileButton)`
	background: ${(props) => props.theme.palette.gray4.regular};
`;

function MailPreview({ message: messageData, firstMail }) {
	const { message, loaded } = useMessage(messageData.id);

	if (!loaded) return null;

	return (
		<MailPreviewLoaded
			message={message}
			firstMail={firstMail}
		/>
	);
}

export default MailPreview;

function MailPreviewLoaded({ message, firstMail }) {
	const mailContainerRef = useRef(undefined);
	const urlMessageId = useQueryParam('message');
	const [open, setOpen] = useState(!!urlMessageId ? false : firstMail);
	const msgRender = useMemo(
		() => <MailMessageRenderer key={message.id} onUnreadLoaded={() => {}} mailMsg={message} />,
		[message]
	);
	const attachments = findAttachments(message.parts, []);

	useLayoutEffect(() => {
		if (typeof urlMessageId === 'undefined' && firstMail) return;
		setOpen(urlMessageId === message._id);
	}, [urlMessageId]);

	return (
		<Container
			ref={mailContainerRef}
			height="fit"
		>
			<MailPreviewBlock
				onClick={() => setOpen(!open)}
				message={message}
				open={open}
			/>
			<Container
				width="fill"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				<Collapse open={open} crossSize="100%" orientation="vertical" disableTransition={true}>
					<Container
						width="100%"
						height="fit"
						crossAlignment="stretch"
						padding={{ horizontal: 'medium', vertical: 'small' }}
						background="gray6"
					>
						{attachments.length > 0
						&& map(
							attachments,
							(att, index) => (
								<Container
									key={`att-${att.filename}-${index}`}
									padding={{ vertical: 'extrasmall' }}
									width="fill"
								>
									<Link
										to={`/service/home/~/?auth=co&id=${message.id}&part=${att.name}&disp=a`}
										target="_blank"
										download
										style={{ width: '100%', textDecoration: 'none' }}
									>
										<StyledDownloadFileButton
											fileName={att.filename}
										/>
									</Link>
								</Container>
							)
						)}
						{msgRender}
					</Container>
				</Collapse>
			</Container>
			<Divider />
		</Container>
	);
}

const fallbackContact = { address: '', displayName: '' };

function MailPreviewBlock({
	message,
	open,
	onClick
}) {

	const actions = [];

	const mainContact = find(message.contacts, ['type', 'f']) || fallbackContact;

	return (
		<HoverContainer
			onClick={onClick}
			orientation="horizontal"
			height="fit"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			background="gray6"
		>
			<Container
				orientation="vertical"
				width="fit"
				mainAlignment="flex-start"
				padding={{ all: 'small' }}
			>
				<Avatar
					label={mainContact.displayName || mainContact.address}
					colorLabel={mainContact.address}
				/>
			</Container>
			<Row
				orientation="vertical"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				height="fit"
				width="calc(100% - 48px)"
				padding={{ all: 'small', bottom: 'medium' }}
				takeAvailableSpace={true}
			>
				<Container
					orientation="horizontal"
					mainAlignment="space-between"
					width="fill"
				>
					<Text>
						{mainContact.displayName || mainContact.address}
					</Text>
					<Container
						orientation="horizontal"
						width="fit"
						height="24px"
					>
						{ message.attachment && <Padding left="small"><Icon icon="AttachOutline" /></Padding> }
						{ message.flagged && <Padding left="small"><Icon color="error" icon="Flag" /></Padding> }
						<Padding left="small"><Text color="gray1">{moment(message.date).fromNow(true)}</Text></Padding>
						{ open && (
							<Padding left="small">
								<Dropdown
									placement="right-end"
									items={map(
										actions,
										(action) => ({
											id: action.id,
											icon: action.icon,
											label: action.label,
											click: action.onActivate
										})
									)}
								>
									<IconButton size="small" icon="MoreVertical" />
								</Dropdown>
							</Padding>
						)}
					</Container>
				</Container>
				{ !open && (
					<Container
						orientation="horizontal"
						mainAlignment="flex-start"
						crossAlignment="center"
						height="16px"
					>
						<MessageContactList message={message} />
					</Container>
				)}
				<Container
					orientation="horizontal"
					mainAlignment="space-between"
					crossAlignment="flex-end"
					height="20px"
					padding={{ top: open ? 'small' : '0'}}
				>
					<Container
						orientation="horizontal"
						mainAlignment="flex-start"
						crossAlignment="center"
						width="fill"
						style={{ minWidth: '0' }}
					>
						{ open
							? <MessageContactList message={message} />
							: <Text color="text" size="medium">{ message.fragment }</Text>
						}
					</Container>
					<Container
						orientation="horizontal"
						width="fit"
						padding={{ left: 'extrasmall', right: open ? 'extrasmall' : '0'}}
					>
						{ message.urgent && <Icon color="error" icon="ArrowUpward" /> }
						{ /* message.folder && message.folder.name !== path && (
							<Padding left="small">
								<Badge
									value={message.folder.name}
									type="read"
								/>
							</Padding>
						) */ }
					</Container>
				</Container>
			</Row>
		</HoverContainer>
	);
}

const ContactsContainer = styled.div`
	display: grid;
	grid-template-rows: auto;
	grid-template-columns: repeat(3, auto);
`;
const ContactText = styled(Text)`
	&:not(:first-child){
		&:before {
			content: '|';
			padding: 0 4px;
		}
	}
`;

function MessageContactList({ message }) {
	const toContacts = filter(message.contacts, ['type', 't']);
	const ccContacts = filter(message.contacts, ['type', 'c']);
	const bccContacts = filter(message.contacts, ['type', 'b']);
	return (
		<ContactsContainer>
			{ toContacts.length > 0 && (
				<ContactText color="gray1" size="small">
					To: { map(toContacts, (contact) => contact.displayName || contact.address).join(',') }
				</ContactText>
			)}
			{ ccContacts.length > 0 && (
				<ContactText color="gray1" size="small">
					Cc: { map(ccContacts, (contact) => contact.displayName || contact.address).join(',') }
				</ContactText>
			)}
			{ bccContacts.length > 0 && (
				<ContactText color="gray1" size="small">
					Bcc: { map(bccContacts, (contact) => contact.displayName || contact.address).join(',') }
				</ContactText>
			)}
		</ContactsContainer>
	);
}
