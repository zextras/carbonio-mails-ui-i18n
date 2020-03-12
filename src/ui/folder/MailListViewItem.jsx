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

import React, { useContext } from 'react';
import { find, truncate } from 'lodash';
import moment from 'moment';
import {
	Avatar,
	Paper,
	createStyles,
	Grid,
	makeStyles,
	Typography,
} from '@material-ui/core';
import {
	RadioButtonUnchecked,
	RadioButtonChecked,
	ArrowUpward,
	Attachment
} from '@material-ui/icons';
import hueFromString from '../../util/hueFromString';
import MailServicesContext from '../../context/MailServicesContext';

const useStyles = makeStyles((theme) =>
	createStyles({
		listItemRoot: {
			borderTop: '1px solid rgba(67,74,84,0.1)',
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
			flexGrow: 1,
			display: 'grid'
		},
		iconsColumn: {
			height: '100%',
			padding: `${theme.spacing(1.5)}px 0`,
			marginRight: theme.spacing(0.5),
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
		miniIcon: {
			width: theme.spacing(2),
			height: theme.spacing(2)
		}
	}));

const MailListViewItem = ({ conversation, useToContact }) => {
	const classes = useStyles();
	const { mailSrvc } = useContext(MailServicesContext);
	const contact = useToContact
		? find(conversation.contacts, (c) => c.type === 'to')
		: find(conversation.contacts, (c) => c.type === 'from');

	const toggleRead = (ev) => {
		ev.stopPropagation();
		ev.preventDefault();
		if (mailSrvc) {
			mailSrvc.setConversationRead(conversation.id, !conversation.read);
		}
	};
	const mDate = moment(conversation.date);
	return (
		<Paper
			className={classes.listItemRoot}
		>
			<Avatar
				className={classes.avatarRand}
				style={{ backgroundColor: contact ? `hsl(${hueFromString(contact.address)}, 50%, 50%)` : 'hsl(180, 50%, 50%)' }}
			>
				{contact ? truncate((contact.name || contact.address), { length: 2, omission: '' }) : '?'}
			</Avatar>
			<Grid className={classes.iconsColumn}>
				{ conversation.read
					? <RadioButtonUnchecked className={classes.miniIcon} color="secondary" onClickCapture={toggleRead} />
					: <RadioButtonChecked className={classes.miniIcon} color="secondary" onClickCapture={toggleRead} />}
				{ conversation.urgent && <ArrowUpward className={classes.miniIcon} color="error" /> }
			</Grid>
			<Grid className={classes.textColumn}>
				<Typography variant={conversation.read ? 'subtitle2' : 'subtitle1'} noWrap>
					{contact && (contact.name || contact.address)}
				</Typography>
				<Typography variant={conversation.read ? 'subtitle2' : 'subtitle1'} noWrap>
					{conversation.subject}
				</Typography>
				<Typography variant="caption" noWrap>
					{conversation.fragment}
				</Typography>
			</Grid>
			<Grid className={classes.endColumn}>
				<Typography variant="caption" noWrap>
					{mDate.format('DD/MM/YYYY HH:MM')}
				</Typography>
				{conversation.attachment
				&& <Attachment />}
			</Grid>
		</Paper>
	);
};
export default MailListViewItem;
