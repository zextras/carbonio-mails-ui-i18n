
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

import React, { useState, useEffect, useContext } from 'react';
import {
	Typography,
	Paper,
	Grid,
	Avatar,
	makeStyles,
	createStyles,
	Collapse
} from '@material-ui/core';
import {
	RadioButtonUnchecked,
	RadioButtonChecked,
	ArrowUpward,
	ChevronLeft,
	ExpandMore
} from '@material-ui/icons';
import {
	find,
	truncate,
	reduce,
	filter,
	get
} from 'lodash';
import hueFromString from '../../util/hueFromString';
import MailServicesContext from '../../context/MailServicesContext';

function useObservable(observable) {
	const [value, setValue] = useState(observable.value);
	useEffect(() => {
		const sub = observable.subscribe(setValue);
		return () => sub.unsubscribe();
	}, [observable]);
	return value;
}

const useStyles = makeStyles((theme) =>
	createStyles({
		messageItemRoot: {
			borderTop: '1px solid rgba(67,74,84,0.1)',
			borderRadius: 0,
			width: '100%',
			backgroundColor: theme.palette.background.paper,
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'flex-start',
			alignItems: 'flex-start',
			padding: theme.spacing(1.5)
		},
		avatar: {
			color: '#ffffff',
		},
		textColumn: {
			width: '100%'
		},
		mailBody: {
			borderTop: '1px solid rgba(67,74,84,0.1)',
			padding: theme.spacing(1.5),
			borderRadius: 0
		},
		iconsColumn: {
			height: '100%',
			margin: `0 ${theme.spacing(1)}px`,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'flex-start'
		}
	}));

export const MailView = ({ mail, first }) => {
	const classes = useStyles();
	const { mailSrvc } = useContext(MailServicesContext);

	const fromContact = find(
		mail.contacts,
		(c) => c.type === 'from'
	);
	const toContact = find(
		mail.contacts,
		(c) => c.type === 'to'
	);
	const ccContacts = filter(
		mail.contacts,
		(contact) => contact.type === 'cc'
	);
	const ccLine = reduce(
		ccContacts,
		(line, contact) => `${line} ${contact.name || contact.address},`, ''
	);

	const [open, setOpen] = useState(first);
	const [readLock, setReadLock] = useState(false);
	useEffect(() => {
		if (mailSrvc && open && !readLock && !mail.read) {
			mailSrvc.setMessageRead(mail, false);
		}
	}, [open, readLock, mail, mailSrvc]);

	const toggleRead = (ev) => {
		ev.stopPropagation();
		ev.preventDefault();
		setReadLock(true);
		if (mailSrvc) {
			mailSrvc.setMessageRead(mail, true);
		}
	};

	const toggleCollapse = () => {
		setOpen(!open);
		setReadLock(false);
	};

	return (
		<>
			<Paper
				className={classes.messageItemRoot}
				onClick={toggleCollapse}
			>
				<Avatar
					className={classes.avatar}
					style={{ backgroundColor: fromContact ? `hsl(${hueFromString(fromContact.address)}, 50%, 50%)` : 'hsl(180, 50%, 50%)' }}
				>
					{fromContact
						? truncate(fromContact.name || fromContact.address, { length: 2, omission: '' })
						: '?'}
				</Avatar>
				<Grid className={classes.iconsColumn}>
					{ mail.read
						? <RadioButtonUnchecked color="secondary" onClickCapture={toggleRead} />
						: <RadioButtonChecked color="secondary" onClickCapture={toggleRead} />}
					{ mail.urgent && <ArrowUpward color="error" /> }
				</Grid>
				<Grid className={classes.textColumn}>
					<Typography variant={mail.read ? 'body2' : 'subtitle2'} noWrap>
						{`From: ${fromContact && (fromContact.name || fromContact.address)}`}
					</Typography>
					<Typography variant={mail.read ? 'body2' : 'subtitle2'} noWrap>
						{`To: ${toContact && (toContact.name || toContact.address)}`}
					</Typography>
					<Typography variant={mail.read ? 'body2' : 'subtitle2'} noWrap>
						{`Cc: ${ccLine}`}
					</Typography>
					<Typography variant={mail.read ? 'body2' : 'subtitle2'} noWrap>
						{`Subject: ${mail.subject}`}
					</Typography>
				</Grid>
				{open ? <ExpandMore /> : <ChevronLeft />}
			</Paper>
			<Collapse in={open}>
				<Paper className={classes.mailBody}>
					<Typography variant="body1" display="block" style={{ whiteSpace: 'pre-line' }} noWrap>
						{get(mail, mail.bodyPath).content}
					</Typography>
				</Paper>
			</Collapse>
		</>
	);
};
