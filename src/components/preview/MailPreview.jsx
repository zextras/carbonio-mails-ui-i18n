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

import React, { useContext, useMemo, useState } from 'react';
import {
	Container,
	Text,
	Avatar,
	Divider,
	Collapse, Icon, Padding
} from '@zextras/zapp-ui';
import moment from 'moment';
import { find } from 'lodash';
import MailMessageRenderer from '../MailMessageRenderer';
import { HoverContainer } from '../list/Components';

const MailPreview = ({
	message,
	open,
	toggleOpen,
	onUnreadLoaded
}) => {
	const msgRender = useMemo(
		() => (
			<MailMessageRenderer key={message.id} onUnreadLoaded={onUnreadLoaded} mailMsg={message} />
		),
		[message]
	);
	return (
		<Container
			height="fit"
		>
			<MailPreviewBlock
				onClick={toggleOpen}
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
				<Collapse open={open} crossSize="100%" orientation="vertical">
					<Container
						width="100%"
						height="fit"
						crossAlignment="stretch"
						padding={{ horizontal: 'medium', bottom: 'small' }}
					>
						{msgRender}
					</Container>
				</Collapse>
			</Container>
			<Divider />
		</Container>
	);
};

export default MailPreview;

const MailPreviewBlock = ({ message, open, onClick }) => {
	const mainContact = find(message.contacts, ['type', 'f']);
	const secondaryContact = (find(message.contacts, ['type', 't'])
		|| find(message.contacts, ['type', 'cc'])
	);
	return (
		<HoverContainer
			onClick={onClick}
			orientation="horizontal"
			height="fit"
			mainAlignment="flex-start"
			crossAlignment={open ? 'flex-start' : 'center'}
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
					height="20px"
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
					height="20px"
				>
					<Text color="txt_4">
						{`To: ${secondaryContact.displayName || secondaryContact.address}`}
					</Text>
				</Container>
				<Container
					orientation="horizontal"
					mainAlignment="space-between"
					crossAlignment="flex-end"
					height="20px"
				>
					<Container
						orientation="horizontal"
						mainAlignment="flex-start"
						crossAlignment="center"
						width="fill"
						style={{ minWidth: '0' }}
					>
						<Text>
							{message.fragment}
						</Text>
					</Container>
					<Container
						orientation="horizontal"
						width="fit"
						padding={{ left: 'extrasmall' }}
					>
						{message.urgent
						&& (
							<Icon color="txt_5" icon="ArrowUpward"/>
						)}
						{message.folder
						&& (
							<Container
								background="bg_10"
								height="20px"
								width="fit"
								padding={{vertical: 'extrasmall', horizontal: 'small'}}
								style={{
									borderRadius: '6px'
								}}
							>
								<Text
									size="small"
								>
									{message.folder.name}
								</Text>
							</Container>
						)}
					</Container>
				</Container>
			</Container>
		</HoverContainer>
	);
};
