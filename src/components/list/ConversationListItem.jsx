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
	Fragment, useState, useEffect
} from 'react';
import moment from 'moment';
import { find, map } from 'lodash';
import {
	Text,
	Container,
	Divider,
	Icon,
	Padding,
	IconButton,
	Collapse,
	Badge,
	Catcher
} from '@zextras/zapp-ui';
import MailListItem from './MailListItem';
import { HoverContainer, SelectableAvatar } from './Components';
import activityContext from '../../activity/ActivityContext';

function useObservable(observable) {
	const [value, setValue] = useState(observable.value);
	useEffect(() => {
		const sub = observable.subscribe(setValue);
		return () => sub.unsubscribe();
	}, [observable]);
	return value;
}

const ConversationListItem = ({
	conversationObs,
	selected,
	selecting,
	selectable,
	onSelect,
	onDeselect
}) => {
	const conversation = useObservable(conversationObs);
	const mainContact = useMemo(
		() => find(
			conversation.participants,
			['type', (conversation.folder === 'Sent' || conversation.folder === 'Drafts') ? 't' : 'f']
		),
		conversation.contacts
	);
	Badge.propTypes = {};
	const [open, setOpen] = useState(false);
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
				onClick={() => {
					set('mailViewMsgId', conversation.messages[0].id);
					set('mailView', conversation.id);
				}}
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
							{conversation.msgCount > 1
							&& (
								<Badge
									value={`${conversation.msgCount}`}
									type={conversation.read ? 'read' : 'unread'}
								/>
							)}
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
							{conversation.messages && conversation.messages.length > 1
							&& (
								<IconButton
									size="small"
									icon={open ? 'ChevronUp' : 'ChevronDown'}
									onClick={(ev) => {
										ev.stopPropagation();
										setOpen(!open);
									}}
								/>
							)}
						</Container>
					</Container>
				</Container>
			</HoverContainer>
			<Divider />
			{conversation.messages && conversation.messages.length > 1
			&& (
				<Collapse open={open} orientation="vertical" crossSize="100%">
					<Container
						height="fit"
						width="fill"
						padding={{ left: 'medium' }}
					>
						{map(
							conversation.messages,
							(email, index) => (email
								? (<MailListItem key={email.id} email={email} selectable={false} />)
								: <Fragment key={index} />
							)
						)}
					</Container>
				</Collapse>
			)}
		</Container>
	);
};

ConversationListItem.defaultProps = {
	selected: false
};

export default ConversationListItem;
