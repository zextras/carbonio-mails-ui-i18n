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

import React, { FC, useState, useEffect } from 'react';
import {
	Typography,
	Paper,
	Grid,
	Avatar,
	makeStyles,
	createStyles,
	Theme,
	Divider,
	Collapse,
	Hidden
} from '@material-ui/core';
import {
	RadioButtonUnchecked,
	RadioButtonChecked,
	ArrowUpward,
	Create,
	Close,
	ChevronLeft,
	ExpandMore
} from '@material-ui/icons';
import { useParams, useLocation } from 'react-router';
import {
	map,
	find,
	truncate,
	sortBy,
	reduce,
	filter,
	get
} from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { IConvSchm, IMailSchm, IMailContactSchm } from '../../idb/IMailSchema';
import { IMailSyncService } from '../../sync/IMailSyncService';
import hueFromString from '../../util/hueFromString';
import MailFolderListView from '../folder/MailFolderListView';
import { IMailService } from '../../mail/IMailService';
import MailServicesContextProvider from '../../context/MailServicesContextProvider';
import { MailView } from './MailMessageView';

function useObservable<T>(observable: BehaviorSubject<T>): T {
	const [value, setValue] = useState<T>(observable.value);
	useEffect(() => {
		const sub = observable.subscribe(setValue);
		return (): void => sub.unsubscribe();
	}, [observable]);
	return value;
}

const useStyles = makeStyles((theme: Theme) =>
	createStyles({
		root: {
			flexDirection: 'row'
		},
		conversationContainer: {
		//	margin: theme.spacing(1),
			maxHeight: '90%',
			overflowY: 'auto'
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
			}
		}
	}));

interface IMailViewProps {
	syncSrvc: IMailSyncService;
	mailSrvc: IMailService;
}

const ConversationView: FC<IMailViewProps> = ({ syncSrvc, mailSrvc }) => {
	const classes = useStyles();
	const { id } = useParams<{ id: string }>();
	const convObs = syncSrvc.getConversationMessages(id);
	const conversation = useObservable<Array<IMailSchm>>(convObs);
	const location = useLocation();
	return (
		<MailServicesContextProvider
			mailSrvc={mailSrvc}
			syncSrvc={syncSrvc}
		>
			<Grid container className={classes.root}>
				<Hidden smDown>
					<MailFolderListView path={location.state.from || 'Inbox'} />
				</Hidden>
				<Grid item xs={12} md={6} className={classes.conversationContainer}>
					<Paper
						className={classes.headerContainer}
					>
						<Typography>
							{location.state.conv && location.state.conv.subject}
						</Typography>
						<Close />
					</Paper>
					{conversation.length > 0
					&& map(
						sortBy(conversation, ['date']).reverse(),
						(mail: IMailSchm, key: number) => (
							<MailView mail={mail} key={key} first={key === 0} />
						)
					)}
				</Grid>
			</Grid>
		</MailServicesContextProvider>
	);
};
export default ConversationView;
