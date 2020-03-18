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

import React, { useMemo, useState, useCallback } from 'react';
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
	Dropdown
} from '@zextras/zapp-ui';
import { useItemActionContext } from '@zextras/zapp-shell/hooks';
import moment from 'moment';
import { find, reduce, map } from 'lodash';
import { Link } from 'react-router-dom';
import MailMessageRenderer from '../MailMessageRenderer';
import { HoverContainer } from '../list/Components';

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

function MailPreview({
	message,
	open,
	toggleOpen,
	onUnreadLoaded,
	path
}) {
	const msgRender = useMemo(
		() => (
			<MailMessageRenderer key={message.id} onUnreadLoaded={onUnreadLoaded} mailMsg={message} />
		),
		[message]
	);
	const attachments = findAttachments(message.parts, []);
	return (
		<Container
			height="fit"
		>
			<MailPreviewBlock
				onClick={toggleOpen}
				message={message}
				open={open}
				path={path}
			/>
			<Container
				width="fill"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				<Collapse open={open} crossSize="100%" orientation="vertical">
					<Container
						width="100%"
						height="fit"
						crossAlignment="stretch"
						padding={{ horizontal: 'medium', vertical: 'small' }}
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
										style={{ width: '100%' }}
									>
										<DownloadFileButton
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

export default MailPreview;

function MailPreviewBlock({
	message,
	open,
	onClick,
	path
}) {
	const [openActionMenu, setActionMenuOpen] = useState(false);

	const { actions } = useItemActionContext('mail-message', message);

	const mainContact = find(message.contacts, ['type', 'f']);
	const secondaryContact = (find(message.contacts, ['type', 't'])
		|| find(message.contacts, ['type', 'cc'])
	);

	const onActionBtnClick = useCallback(
		(ev) => {
			setActionMenuOpen(!openActionMenu);
			ev.stopPropagation();
		},
		[setActionMenuOpen, openActionMenu]
	);

	return (
		<HoverContainer
			onClick={onClick}
			orientation="horizontal"
			height="fit"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			style={{ cursor: 'pointer' }}
		>
			<Container
				orientation="vertical"
				width="fit"
				padding={{ all: 'small' }}
			>
				<Avatar
					label={mainContact.displayName || mainContact.address}
					colorLabel={mainContact.address}
				/>
			</Container>
			<Container
				orientation="vertical"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				height="fit"
				width="calc(100% - 48px)"
				padding={{ top: 'small', right: 'medium', bottom: 'small' }}
			>
				<Container
					orientation="horizontal"
					mainAlignment="space-between"
					width="fill"
					padding={{ bottom: 'extrasmall' }}
				>
					<Text size="large">
						{mainContact.displayName || mainContact.address}
					</Text>
					<Container
						orientation="horizontal"
						width="fit"
					>
						{message.flagged
						&& <Padding horizontal="extrasmall"><Icon color="txt_5" icon="Flag" /></Padding>}
						<Text size="small" color="txt_4">{moment(message.date).fromNow(true)}</Text>
					</Container>
				</Container>
				<Container
					orientation="horizontal"
					mainAlignment="flex-start"
					crossAlignment="center"
					padding={{ bottom: 'extrasmall' }}
				>
					<Text color="txt_4">
						{`To: ${secondaryContact.displayName || secondaryContact.address}`}
					</Text>
				</Container>
				<Container
					orientation="horizontal"
					mainAlignment="space-between"
					crossAlignment="flex-end"
				>
					<Container
						orientation="horizontal"
						mainAlignment="flex-start"
						crossAlignment="center"
						width="fill"
						height="20px"
						style={{ minWidth: '0' }}
					>
						<Text>
							{!open && message.fragment}
						</Text>
					</Container>
					<Container
						orientation="horizontal"
						width="fit"
						padding={{ left: 'extrasmall' }}
					>
						{message.urgent
						&& (
							<Icon color="txt_5" icon="ArrowUpward" />
						)}
						{message.folder && message.folder.name !== path
						&& (
							<Badge
								value={message.folder.name}
								type="read"
							/>
						)}
					</Container>
				</Container>
			</Container>
			<Container
				width="fit"
			>
				<IconButton
					icon="MoreVertical"
					onClick={onActionBtnClick}
				/>
				<Dropdown
					right="0"
					items={map(
						actions,
						(action) => {
							// console.log('Action ID', action.id);
							return ({
								id: action.id,
								icon: action.icon,
								label: action.label,
								click: action.onActivate
							});
						}
					)}
					open={openActionMenu}
					closeFunction={onActionBtnClick}
				/>
			</Container>
		</HoverContainer>
	);
}
