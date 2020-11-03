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
	useLayoutEffect, useMemo,
	useState, useRef, useCallback
} from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import {
	find, map, reduce, filter
} from 'lodash';
import { hooks } from '@zextras/zapp-shell';
import { useParams } from 'react-router-dom';
import {
	Container,
	Text,
	Avatar,
	Badge,
	Divider,
	Collapse,
	Icon,
	Padding,
	IconButton,
	Row,
	Dropdown
} from '@zextras/zapp-ui';

import { useMessage, useFolder } from '../hooks';
import useQueryParam from '../hooks/useQueryParam';
import MailMessageRenderer from '../commons/mail-message-renderer';
import { getTimeLabel, participantToString } from '../commons/utils';
import AttachmentsBlock from './attachments-block';

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

function MailPreview({ message: messageData, firstMail }) {
	const [message, loaded] = useMessage(messageData.id);

	if (!loaded || !message) return null;

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
	const [open, setOpen] = useState(!urlMessageId ? firstMail : false);
	const msgRender = useMemo(
		() => <MailMessageRenderer key={message.id} onUnreadLoaded={() => {}} mailMsg={message} />,
		[message]
	);
	const attachments = useMemo(() => findAttachments(message.parts, []), [message]);

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
						<AttachmentsBlock message={message} attachments={attachments} />
						<Padding style={{ width: '100%' }} vertical="medium">{ msgRender }</Padding>
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
	const { t } = useTranslation();
	const replaceHistory = hooks.useReplaceHistoryCallback();
	const { folderId } = useParams();
	const { db } = hooks.useAppContext();

	const actions = useMemo(() => {
		const arr = [];

		if (message.parent === '6') {	// DRAFT
			arr.push({
				id: 'message-preview-edit-draft',
				icon: 'Edit2Outline',
				label: t('Edit Draft'),
				onActivate: () => replaceHistory(`/folder/${folderId}?edit=${message._id}`)
			});
		}
		if (message.parent === '2' || message.parent === '5') { // INBOX OR SENT
			arr.push({
				id: 'message-preview-reply',
				icon: 'UndoOutline',
				label: t('Reply'),
				onActivate: () => replaceHistory(`/folder/${folderId}?edit=new&action=reply&actionId=${message.id}`)
			});
			arr.push({
				id: 'message-preview-reply-all',
				icon: 'ReplyAll',
				label: t('Reply to All'),
				onActivate: () => replaceHistory(`/folder/${folderId}?edit=new&action=replyAll&actionId=${message.id}`)
			});
			arr.push({
				id: 'message-preview-forward',
				icon: 'Forward',
				label: t('Forward'),
				onActivate: () => replaceHistory(`/folder/${folderId}?edit=new&action=forward&actionId=${message.id}`)
			});
			arr.push({
				id: 'message-preview-edit-as-new',
				icon: 'Edit2Outline',
				label: t('Edit as new'),
				onActivate: () => replaceHistory(`/folder/${folderId}?edit=new&action=editAsNew&actionId=${message.id}`)
			});
		}
		if (!message.flagged) {
			arr.push({
				id: 'message-preview-flag',
				icon: 'FlagOutline',
				label: t('Set as flagged'),
				onActivate: (ev) => {
					ev.preventDefault();
					db.setFlag(message._id, true);
				}
			});
		}
		else {
			arr.push({
				id: 'message-preview-not-flag',
				icon: 'Flag',
				label: t('Set as not flagged'),
				onActivate: (ev) => {
					ev.preventDefault();
					db.setFlag(message._id, false);
				}
			});
		}
		if (message.parent === '3' || message.parent === '4') { // TRASH OR JUNK
			arr.push({
				id: 'message-preview-delete',
				icon: 'TrashOutline',
				label: t('Delete Message'),
				onActivate: () => {
					db.deleteMessage(message);
				}
			});
		}
		else {
			arr.push({
				id: 'message-preview-trash',
				icon: 'TrashOutline',
				label: t('Move to Trash'),
				onActivate: () => {
					db.moveMessageToTrash(message._id);
				}
			});
		}
		return arr;
	}, [db, folderId, message._id, message.parent, message.flagged, replaceHistory, t]);

	const { folderId: currentFolderId } = useParams();
	const { folder: messageFolder, folderLoaded: messageFolderLoaded } = useFolder(message.parent);
	const mainContact = find(message.contacts, ['type', 'f']) || fallbackContact;
	const _onClick = useCallback((e) => !e.isDefaultPrevented() && onClick(e), [onClick]);
	return (
		<HoverContainer
			onClick={_onClick}
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
					<Text
						size={message.read ? 'medium' : 'large'}
						color={message.read ? 'text' : 'primary'}
						weight={message.read ? 'normal' : 'bold'}
					>
						{participantToString(mainContact, t)}
					</Text>
					<Container
						orientation="horizontal"
						width="fit"
						height="24px"
					>
						{ message.attachment && <Padding left="small"><Icon icon="AttachOutline" /></Padding> }
						{ message.flagged && <Padding left="small"><Icon color="error" icon="Flag" /></Padding> }
						<Padding left="small"><Text color="gray1">{ getTimeLabel(message.date) }</Text></Padding>
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
						<MessageContactsList message={message} />
					</Container>
				)}
				<Container
					orientation="horizontal"
					mainAlignment="space-between"
					crossAlignment="flex-end"
					height="20px"
					padding={{ top: open ? 'small' : '0' }}
				>
					<Container
						orientation="horizontal"
						mainAlignment="flex-start"
						crossAlignment="center"
						width="fill"
						style={{ minWidth: '0' }}
					>
						{ open
							? <MessageContactsList message={message} />
							: <Text color="text" size="medium">{ message.fragment }</Text> }
					</Container>
					<Container
						orientation="horizontal"
						width="fit"
						padding={{ left: 'extrasmall', right: open ? 'extrasmall' : undefined }}
					>
						{ message.urgent && <Icon color="error" icon="ArrowUpward" /> }
						{ messageFolderLoaded && messageFolder._id !== currentFolderId && (
							<Padding left="small">
								<Badge value={messageFolder.name} type={message.read ? 'read' : 'unread'} />
							</Padding>
						) }
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
function MessageContactsList({ message }) {
	const { t } = useTranslation();
	const accounts = hooks.useUserAccounts();
	const toContacts = filter(message.contacts, ['type', 't']);
	const ccContacts = filter(message.contacts, ['type', 'c']);
	const bccContacts = filter(message.contacts, ['type', 'b']);

	return (
		<ContactsContainer>
			{ toContacts.length > 0 && (
				<ContactText color="gray1" size="small">
					{ `${t('To')}: ` }
					{ map(toContacts, (contact) => participantToString(contact, t, accounts)).join(', ') }
				</ContactText>
			)}
			{ ccContacts.length > 0 && (
				<ContactText color="gray1" size="small">
					{ `${t('Cc')}: ` }
					{ map(ccContacts, (contact) => participantToString(contact, t, accounts)).join(', ') }
				</ContactText>
			)}
			{ bccContacts.length > 0 && (
				<ContactText color="gray1" size="small">
					{ `${t('Bcc')}: ` }
					{ map(bccContacts, (contact) => participantToString(contact, t, accounts)).join(', ') }
				</ContactText>
			)}
		</ContactsContainer>
	);
}
