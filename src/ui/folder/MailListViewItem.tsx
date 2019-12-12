/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2019 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import React, { FC, useContext } from 'react';
import { find, truncate } from 'lodash';
import moment from 'moment';
import { Link as RouterLink, LinkProps as RouterLinkProps, useLocation } from 'react-router-dom';
import {
	Avatar,
	Paper,
	createStyles,
	Grid,
	GridListTile, ListItem,
	makeStyles,
	Theme,
	Typography
} from '@material-ui/core';
import { RadioButtonUnchecked, RadioButtonChecked, ArrowUpward, Attachment } from '@material-ui/icons';
import { IConvSchm, IMailContactSchm } from '../../idb/IMailSchema';
import hueFromString from '../../util/hueFromString';
import MailServicesContext from '../../context/MailServicesContext';
import { IMailServicesContext } from '../../context/IMailServicesContext';

const useStyles = makeStyles((theme: Theme) =>
	createStyles({
		listItemRoot: {
			borderRadius: 0,
			width: '100%',
			backgroundColor: theme.palette.background.paper,
			height: 70,
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'flex-start',
			alignItems: 'center'
		},
		inline: {
			display: 'inline',
		},
		avatarRand: {
			margin: theme.spacing(1.5),
			color: '#ffffff',
		},
		textColumn: {
			flexGrow: 1
		},
		iconsColumn: {
			height: '100%',
			padding: `${theme.spacing(0.5)}px 0`,
			marginRight: theme.spacing(1),
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'flex-start'
		},
		endColumn: {
			padding: theme.spacing(0.5),
			height: '100%',
			display: 'flex',
			alignItems: 'flex-end',
			justifyContent: 'space-between',
			flexDirection: 'column'
		},
		dateText: {
		},
		attachmentIcon: {
			color: theme.palette.text.secondary
		}
	}));

interface IMailListViewItemProps {
	conversation: IConvSchm;
	onReadIconClick: () => void;
}

const MailListViewItem: FC<IMailListViewItemProps> = ({ conversation }) => {
	const classes = useStyles();
	const { mailSrvc } = useContext<IMailServicesContext>(MailServicesContext);
	const fromContact: IMailContactSchm | undefined = find(conversation.contacts, (c: IMailContactSchm): boolean => c.type === 'from');
	const toggleRead = (ev: React.MouseEvent): void => {
		ev.stopPropagation();
		ev.preventDefault();
		mailSrvc.setRead('conversation', conversation.id, !conversation.read);
	};
	return (
		<Paper
			className={classes.listItemRoot}
		>
			<Avatar
				className={classes.avatarRand}
				style={{ backgroundColor: fromContact ? `hsl(${hueFromString(fromContact.address)}, 50%, 50%)` : 'hsl(180, 50%, 50%)' }}
			>
				{fromContact ? truncate((fromContact.name || fromContact.address), { length: 2, omission: '' }) : '?'}
			</Avatar>
			<Grid className={classes.iconsColumn}>
				{ conversation.read
					? <RadioButtonUnchecked color="primary" onClickCapture={toggleRead} />
					: <RadioButtonChecked color="primary" onClickCapture={toggleRead} />}
				{ conversation.urgent && <ArrowUpward color="error" /> }
			</Grid>
			<Grid className={classes.textColumn}>
				<Typography variant={conversation.read ? 'body2' : 'subtitle2'}>
					{fromContact && (fromContact.name || fromContact.address)}
				</Typography>
				<Typography variant={conversation.read ? 'body2' : 'subtitle2'}>
					{conversation.subject}
				</Typography>
				<Typography variant="subtitle2">
					{truncate(conversation.fragment, { length: 30, omission: '...' })}
				</Typography>
			</Grid>
			<Grid className={classes.endColumn}>
				<Typography className={classes.dateText} variant="body2" color="textSecondary">
					{moment(conversation.date).format()}
				</Typography>
				{conversation.attachment
				&& <Attachment className={classes.attachmentIcon} />}
			</Grid>
		</Paper>
	);
};
export default MailListViewItem;
