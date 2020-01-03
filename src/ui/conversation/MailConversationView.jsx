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
	makeStyles,
	createStyles
} from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import {
	map,
	sortBy,
	filter,
} from 'lodash';
import { MailView } from './MailMessageView';
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
		root: {
			flexDirection: 'row'
		},
		conversationContainer: {
			padding: `0 ${theme.spacing(1)}px`
		},
		headerContainer: {
			borderRadius: 0,
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-start',
			height: theme.spacing(6),
			'& *': {
				margin: `0 0 0 ${theme.spacing(1.5)}px`
			},
			'& > :last-child': {
				margin: `0 ${theme.spacing(1.5)}px 0 auto`
			},
			messageList: {
				maxHeight: 'calc(100vh - 112px)',
				overflowY: 'auto'
			}
		}
	}));

const ConversationView = ({ id }) => {
	const classes = useStyles();
	const { syncSrvc } = useContext(MailServicesContext);
	const convMessagesObs = syncSrvc.getConversationMessages(id);
	const convMessages = useObservable(convMessagesObs);
	const convDataObs = syncSrvc.getConversationData(id);
	const convData = useObservable(convDataObs);
	const location = useLocation();

	const mapMails = () => {
		let messages = sortBy(convMessages, ['date']).reverse();
		if (location.pathname === '/mail/folder/Trash') {
			messages = filter(messages, (c) => c.folder === '3');
		}
		return map(
			messages,
			(mail, key) => (
				<MailView mail={mail} key={key} first={key === 0} />
			)
		);
	};

	return (
		<Grid item xs={12} md={6} className={classes.conversationContainer}>
			<Paper
				className={classes.headerContainer}
			>
				<Typography noWrap>
					{convData && convData.subject}
				</Typography>
				<Link to={location.pathname}>
					<Close />
				</Link>
			</Paper>
			<Grid style={{ maxHeight: 'calc(100vh - 112px)', overflowY: 'auto' }} className={classes.messageList}>
				{convMessages.length > 0
				&& mapMails()}
			</Grid>
		</Grid>
	);
};
export default ConversationView;
