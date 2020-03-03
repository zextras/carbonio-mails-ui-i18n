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
import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { find } from 'lodash';
import {
	Text,
	Container,
	Divider,
	Icon,
	Padding
} from '@zextras/zapp-ui';
import { HoverContainer, SelectableAvatar } from './Components';
import activityContext from '../../activity/ActivityContext';

const MailListItem = ({
	email,
	selected,
	selecting,
	onSelect,
	onDeselect,
	folder,
	selectable
}) => {
	const mainContact = useMemo(() => {
		return find(email.contacts, ['type', (folder === 'Sent' || folder === 'Drafts')? 't' : 'f']);
	}, email.contacts);
	const { set } = useContext(activityContext);
	return (
		<HoverContainer
			orientation="vertical"
			width="fill"
			height="fit"
			style={{
				cursor: 'pointer'
			}}
			onClick={
				() => {
					set('mailView', email.conversation);
					set('mailViewMsgId', email.id);
				}
			}
		>
			<Container
				orientation="horizontal"
				width="100%"
				height="fit"
				mainAlignment="flex-start"
				style={{ position: 'relative' }}
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
						padding={{ bottom: 'extrasmall' }}
					>
						<Text
							color={email.read ? 'txt_1' : 'txt_2'}
							weight={email.read ? 'regular' : 'bold'}
						>
							{mainContact.displayName || mainContact.address}
						</Text>
						<Container
							orientation="horizontal"
							width="fit"
						>
							{email.attachment
							&& <Padding horizontal="extrasmall"><Icon icon="Attach"/></Padding>}
							{email.flagged
							&& <Padding horizontal="extrasmall"><Icon color="txt_5" icon="Flag"/></Padding>}
							<Text size="small" color="txt_4">{moment(email.date).fromNow(true)}</Text>
						</Container>
					</Container>
					<Container
						orientation="horizontal"
						mainAlignment="space-between"
						crossAlignment="flex-end"
						height="24px"
					>
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
								style={{ maxWidth: '100%' }}
							>
								<Text
									weight={email.read ? 'regular' : 'bold'}
									size="large"
								>
									{email.subject}
								</Text>
							</Container>
							<Text
								color="txt_4"
							>
								{email.fragment}
							</Text>
						</Container>
						<Container
							orientation="horizontal"
							width="fit"
						>
							{email.urgent
								&& (
									<Padding horizontal="extrasmall">
										<Icon color="txt_5" icon="ArrowUpward"/>
									</Padding>
								)
							}
							{folder &&
							<Container
								background={email.read ? 'bg_10' : 'bg_1'}
								height="20px"
								width="fit"
								padding={{vertical: 'extrasmall', horizontal: 'small'}}
								style={{
									borderRadius: '6px'
								}}
							>
								<Text
									size="small"
									color={email.read ? 'txt_1' : 'txt_3'}
								>
									{folder}
								</Text>
							</Container>
							}
						</Container>
					</Container>
				</Container>
			</Container>
			<Divider/>
		</HoverContainer>
	);
};

MailListItem.propTypes = {
	folder: PropTypes.string,
	email: PropTypes.shape(
		{
			conversation: PropTypes.string,
			contacts: PropTypes.arrayOf(
				PropTypes.shape({
					type: PropTypes.oneOf(['f', 't', 'c', 'b', 'r', 's', 'n', 'rf']),
					address: PropTypes.string,
					displayName: PropTypes.string
				})
			),
			date: PropTypes.number,
			subject: PropTypes.string,
			fragment: PropTypes.string,
			size: PropTypes.number,
			read: PropTypes.bool,
			attachment: PropTypes.bool,
			flagged: PropTypes.bool,
			urgent: PropTypes.bool,
			bodyPath: PropTypes.string
		}
	).isRequired,
	selectable: PropTypes.bool,
	selected: PropTypes.bool,
	selecting: PropTypes.bool,
	onSelect: PropTypes.func,
	onDeselect: PropTypes.func,
};

MailListItem.defaultProps = {
	selectable: true,
	selected: false,
	selecting: false
};

export default MailListItem;
