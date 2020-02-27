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
	useContext,
	useMemo,
	useState,
	Fragment
} from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { find, map, orderBy } from 'lodash';
import {
	Text,
	Container,
	Divider,
	Icon,
	Padding,
	IconButton,
	Collapse,
	Catcher
} from '@zextras/zapp-ui';
import mailContext from '../../context/MailContext';
import MailListItem from './MailListItem';
import { HoverContainer, SelectableAvatar } from './Components';
import activityContext from '../../activity/ActivityContext';

const ConversationListItem = ({
	conversation,
	selected,
	selecting,
	selectable,
	open,
	onExpand,
	onCollapse,
	onSelect,
	onDeselect
}) => {
	const mainContact = useMemo(
		() => find(
			conversation.participants,
			['type', (conversation.folder === 'Sent' || conversation.folder === 'Drafts') ? 't' : 'f']
		),
		conversation.contacts
	);
	const { mails } = useContext(mailContext);
	const conversationMails = useMemo(
		() => orderBy(map(conversation.messages, (mInfo) => mails[mInfo.id]), ['data.date'], ['desc']),
		[mails, conversation]
	);
	const { set } = useContext(activityContext);
	return (
		<Container
			orientation="vertical"
			width="fill"
			height="fit"
		>
			<HoverContainer
				orientation="horizontal"
				width="100%"
				height="fit"
				mainAlignment="flex-start"
				style={{ position: 'relative', cursor: 'pointer' }}
				onClick={() => set('mailView', conversation.id, conversationMails[0].id)}
			>
				<SelectableAvatar
					label={mainContact.displayName || mainContact.address}
					colorLabel={mainContact.address}
					selectable={selectable}
					selected={selected}
					selecting={selecting}
					onSelect={onSelect}
					onDeselect={onDeselect}
				/>
				<Container
					orientation="vertical"
					width="calc(100% - 48px)"
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					padding={{ vertical: 'small', right: 'small' }}
				>
					<Container
						orientation="horizontal"
						height="24px"
						mainAlignment="space-between"
						width="fill"
						padding={{bottom: 'extrasmall'}}
					>
						<Text
							color={conversation.read ? 'txt_1' : 'txt_2'}
							weight={conversation.read ? 'regular' : 'bold'}
						>
							{mainContact.displayName || mainContact.address}
						</Text>
						<Container
							orientation="horizontal"
							width="fit"
						>
							{conversation.attachment
							&& <Padding horizontal="extrasmall"><Icon icon="Attach"/></Padding>}
							{conversation.flagged
							&& <Padding horizontal="extrasmall"><Icon color="txt_5" icon="Flag"/></Padding>}
							<Text size="small" color="txt_4">{moment(conversation.date).fromNow(true)}</Text>
						</Container>
					</Container>
					<Container
						orientation="horizontal"
						mainAlignment="space-between"
						crossAlignment="flex-end"
						height="24px"
					>
						<Padding right="extrasmall">
							<Container
								background={conversation.read ? 'bg_10' : 'bg_1'}
								height="20px"
								width="fit"
								padding={{vertical: 'extrasmall', horizontal: 'small'}}
								style={{
									borderRadius: '8px'
								}}
							>
								<Text
									size="small"
									color={conversation.read ? 'txt_1' : 'txt_3'}
								>
									{conversation.msgCount}
								</Text>
							</Container>
						</Padding>
						<Container
							orientation="horizontal"
							mainAlignment="flex-start"
							crossAlignment="baseline"
							width="fill"
							style={{ minWidth: '0' }}
						>
							<Container
								padding={{ right: 'extrasmall' }}
								width="fit"
								mainAlignment="flex-end"
								style={{ maxWidth: '100%' }}
							>
								<Text
									weight={conversation.read ? 'regular' : 'bold'}
									size="large"
								>
									{conversation.subject}
								</Text>
							</Container>
							<Text
								color="txt_4"
							>
								{conversation.fragment}
							</Text>
						</Container>
						<Container
							orientation="horizontal"
							width="fit"
						>
							{conversation.urgent
							&& (
								<Padding horizontal="extrasmall">
									<Icon color="txt_5" icon="ArrowUpward" />
								</Padding>
							)}
							{conversationMails && conversationMails.length > 1
							&& (
								<IconButton
									size="small"
									icon={open ? 'ChevronUp' : 'ChevronDown'}
									onClick={(ev) => {
										ev.stopPropagation();
										if (open) {
											onCollapse();
										}
										else {
											onExpand();
										}
									}}
								/>
							)}
						</Container>
					</Container>
				</Container>
			</HoverContainer>
			<Divider />
			{conversationMails && conversationMails.length > 1
			&& (
				<Collapse open={open} orientation="vertical" crossSize="100%">
					<Container
						height="fit"
						width="fill"
						padding={{ left: 'medium' }}
					>
						{map(
							conversationMails,
							(email, index) => (email
								? (<MailListItem key={index} email={email} selectable={false} />)
								: <Fragment key={index} />
							)
						)}
					</Container>
				</Collapse>
			)}
		</Container>
	);
};

ConversationListItem.propTypes = {
	conversation: PropTypes.shape(
		{
			attachment:	PropTypes.bool,
			contacts:	PropTypes.arrayOf(
				PropTypes.shape({
					type: PropTypes.oneOf(['f', 't', 'c', 'b', 'r', 's', 'n', 'rf']),
					address: PropTypes.string,
					displayName: PropTypes.string
				})
			),
			flagged:	PropTypes.bool,
			folder:	PropTypes.string,
			fragment:	PropTypes.string,
			id:	PropTypes.string,
			messages:	PropTypes.arrayOf(PropTypes.shape({
				id: PropTypes.string,
				parent: PropTypes.string
			})),
			msgCount:	PropTypes.number,
			read:	PropTypes.bool,
			size:	PropTypes.number,
			subject:	PropTypes.string,
			unreadMsgCount:	PropTypes.number,
			urgent:	PropTypes.bool,
		}
	).isRequired,
	selecting: PropTypes.bool,
	selected: PropTypes.bool,
	onSelect: PropTypes.func,
	onDeselect: PropTypes.func,
};

ConversationListItem.defaultProps = {
	selected: false
};

export default ConversationListItem;
