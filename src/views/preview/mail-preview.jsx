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
	useMemo, useState, useRef, useCallback, useContext, useEffect,
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
	Dropdown,
	SnackbarManagerContext
} from '@zextras/zapp-ui';

import { useDispatch, useSelector } from 'react-redux';
import MailMessageRenderer from '../../commons/mail-message-renderer';
import { getTimeLabel, participantToString } from '../../commons/utils';
import AttachmentsBlock from './attachments-block';
import { selectFolders } from '../../store/folders-slice';
import {
	deleteMsg,
	editAsNewMsg,
	editDraft,
	forwardMsg,
	moveMsgToTrash,
	replyAllMsg,
	replyMsg,
	setMsgFlag,
	setMsgRead,
} from '../../ui-actions/message-actions';
import { selectMessages } from '../../store/messages-slice';
import { getMsg } from '../../store/actions';

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
	const [ t ] = useTranslation();
	const accounts = hooks.useUserAccounts();
	const toContacts = filter(message.participants, ['type', 't']);
	const ccContacts = filter(message.participants, ['type', 'c']);
	const bccContacts = filter(message.participants, ['type', 'b']);

	return (
		<ContactsContainer>
			{ toContacts.length > 0 && (
				<ContactText color="gray1" size="small">
					{ t('label.to') }
					{ map(toContacts, (contact) => participantToString(contact, t, accounts)).join(', ') }
				</ContactText>
			)}
			{ ccContacts.length > 0 && (
				<ContactText color="gray1" size="small">
					{ t('label.cc') }
					{ map(ccContacts, (contact) => participantToString(contact, t, accounts)).join(', ') }
				</ContactText>
			)}
			{ bccContacts.length > 0 && (
				<ContactText color="gray1" size="small">
					{ t('label.bcc') }
					{ map(bccContacts, (contact) => participantToString(contact, t, accounts)).join(', ') }
				</ContactText>
			)}
		</ContactsContainer>
	);
}

const fallbackContact = { address: '', displayName: '' };
const HoverContainer = styled(Container)`
	cursor: pointer;
	&:hover{
		background: ${({ theme }) => theme.palette.highlight.regular};
	}
`;

function MailPreviewBlock({ message, open, onClick }) {
	const [ t ] = useTranslation();
	const replaceHistory = hooks.useReplaceHistoryCallback();
	const { folderId } = useParams();
	const createSnackbar = useContext(SnackbarManagerContext);
	const accounts = hooks.useUserAccounts();
	const dispatch = useDispatch();

	const actions = useMemo(() => {
		const arr = [];

		if (message.parent === '6') {	// DRAFT
			arr.push(editDraft(message.id, folderId , t, replaceHistory));

		}
		if (message.parent === '2' || message.parent === '5') { // INBOX OR SENT
			arr.push(replyMsg(message.id, folderId, t, replaceHistory));
			arr.push(replyAllMsg(message.id, folderId, t, replaceHistory));
			arr.push(forwardMsg(message.id, folderId, t, replaceHistory));
			arr.push(editAsNewMsg(message.id, folderId, t, replaceHistory));
		}
		arr.push(setMsgFlag([message.id], message.flagged, t, dispatch));
		if (message.parent !== '3' && message.parent !== '4') { // not in TRASH OR JUNK
			arr.push(moveMsgToTrash([message.id], t, dispatch, createSnackbar));
		}
		else {
			arr.push(deleteMsg([message.id], t, dispatch));
		}
		return arr;
	}, [message, t, replaceHistory, folderId, createSnackbar, dispatch, message.flagged]);

	const { folderId: currentFolderId } = useParams();
	const folders = useSelector(selectFolders);
	const messageFolder = folders[message.parent];
	const mainContact = find(message.participants, ['type', 'f']) || fallbackContact;
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
					label={mainContact.fullName || mainContact.address}
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
				takeAvailableSpace
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
						{participantToString(mainContact, t, accounts)}
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
											id: action.label,
											icon: action.icon,
											label: action.label,
											click: (ev) => {
												if(ev) ev.preventDefault();
												action.action();
											},
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
						{ messageFolder.id !== currentFolderId && (
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

export default function MailPreview({ message, expanded }) {
	const [ t ] = useTranslation();
	const dispatch = useDispatch();
	const mailContainerRef = useRef(undefined);
	const [open, setOpen] = useState(expanded);

	const msg = useSelector(selectMessages)[message.id] || {};

	const aggregatedMessage = useMemo(() => ({ ...message, ...msg }), [message, msg]);

	// this is necessary because if somebody click a message in the same conversation
	// already open that message will not be expanded
	useEffect(() => {
		setOpen(expanded);
	}, [expanded]);

	useEffect(() => {
		if (open) {
			dispatch(getMsg({ msgId: message.id }));
		}
	}, [message, open, dispatch]);
	
	const collapsedContent = useMemo(() => (
		<Container
			width="100%"
			height="fit"
			crossAlignment="stretch"
			padding={{ horizontal: 'medium', vertical: 'small' }}
			background="gray6"
		>
			<AttachmentsBlock message={aggregatedMessage} />
			<Padding style={{ width: '100%' }} vertical="medium">
				<MailMessageRenderer
					key={message.id}
					mailMsg={aggregatedMessage}
					setRead={() => {
						if(msg.read === false)
							setMsgRead([msg.id], false, t, dispatch).action();
					}}
				/>
			</Padding>
		</Container>
	), [aggregatedMessage.parts]);

	return (
		<Container
			ref={mailContainerRef}
			height="fit"
		>
			<MailPreviewBlock
				onClick={() => setOpen((o) => !o)}
				message={aggregatedMessage}
				open={open}
			/>
			<Container
				width="fill"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				<Collapse open={open} crossSize="100%" orientation="vertical" disableTransition>
					{aggregatedMessage.parts.length > 0 && collapsedContent}
				</Collapse>
			</Container>
			<Divider />
		</Container>
	);
}
