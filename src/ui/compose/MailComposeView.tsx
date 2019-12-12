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

import React, {
	FC,
	useContext,
	ChangeEvent,
	useEffect
} from 'react';
import {
	Hidden,
	Paper,
	Divider,
	makeStyles,
	createStyles,
	Theme,
	TextField,
	Button,
	Typography,
	Grid,
} from '@material-ui/core';
import {
	Create,
	Close,
	Send,
	Save,
} from '@material-ui/icons';
import { useLocation, useParams } from 'react-router';
import clsx from 'clsx';
import { truncate, startsWith, replace } from 'lodash';
import { I18nCtxt } from '@zextras/zapp-shell/context';
import ComposerContext from '../../composer/ComposerContext';
import { IMailService } from '../../mail/IMailService';
import { IMailSyncService } from '../../sync/IMailSyncService';
import MailServicesContextProvider from '../../context/MailServicesContextProvider';
import ComposerContextProvider from '../../composer/ComposerContextProvider';
import MailFolderListView from '../folder/MailFolderListView';

interface IMailComposeViewProps {
	mailSrvc: IMailService;
	syncSrvc: IMailSyncService;
}

const getPath = (location: { state: any }): string => {
	if (location.state) {
		if (location.state.from) {
			return location.state.from;
		}
		if (location.state.fromPathname && startsWith(location.state.fromPathname, '/mail/folder/')) {
			return replace(location.state.fromPathname, '/mail/folder/', '');
		}
	}
	return 'Drafts';
};

const MailComposeView: FC<IMailComposeViewProps> = ({ mailSrvc, syncSrvc }) => {
	const location = useLocation();
	const { id } = useParams<{ id: string }>();
	return (
		<MailServicesContextProvider
			mailSrvc={mailSrvc}
			syncSrvc={syncSrvc}
		>
			<ComposerContextProvider convId={id}>
				<Grid container>
					<Hidden smDown>
						<MailFolderListView path={getPath(location)} />
					</Hidden>
					<MailComposer />
				</Grid>
			</ComposerContextProvider>
		</MailServicesContextProvider>
	);
};

const useStyles = makeStyles((theme: Theme) =>
	createStyles({
		composerContainer: {
			height: 'calc(100% - 64px)'
		},
		noRoundCorners: {
			borderRadius: 0
		},
		headerContainer: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'flex-start',
			height: theme.spacing(6),
			'& *': {
				margin: `0 0 0 ${theme.spacing(1.5)}px`
			},
			'& > :last-child': {
				margin: `0 ${theme.spacing(1.5)}px 0 auto`
			}
		},
		inputContainer: {
			display: 'flex',
			flexDirection: 'column',
			'& .MuiTextField-root': {
				margin: theme.spacing(1)
			}
		},
		button: {
			margin: theme.spacing(1.5),
			marginLeft: 0
		},
		footerContainer: {
			display: 'flex',
			justifyContent: 'flex-end'
		}
	}));

const MailComposer: FC<{}> = () => {
	const { t } = useContext(I18nCtxt);
	const classes = useStyles();
	const {
		to,
		cc,
		subject,
		message,
		send,
		save,
		setField,
	} = useContext(ComposerContext);

	return (
		<Grid item xs={12} md={6} className={classes.composerContainer}>
			<Paper className={clsx([classes.headerContainer, classes.noRoundCorners])}>
				<Create />
				<Typography>
					{truncate(subject, { length: 24, separator: ' ' }) || truncate(message, { length: 24, separator: ' ' }) || t('mail.composer.header', 'New Mail')}
				</Typography>
				<Close />
			</Paper>
			<Paper className={clsx([classes.inputContainer, classes.noRoundCorners])}>
				<Divider />
				<TextField
					inputProps={{
						className: classes.noRoundCorners
					}}
					value={to}
					label={t('mail.composer.to', 'To:')}
					type="email"
					variant="filled"
					margin="dense"
					onChange={(ev: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => setField('to', ev.target.value)}
				/>
				<TextField
					inputProps={{
						className: classes.noRoundCorners
					}}
					value={cc}
					label={t('mail.composer.cc', 'Cc:')}
					variant="filled"
					margin="dense"
					onChange={(ev: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => setField('cc', ev.target.value)}
				/>
				<TextField
					inputProps={{
						className: classes.noRoundCorners
					}}
					value={subject}
					label={t('mail.composer.subject', 'Subject:')}
					variant="filled"
					margin="dense"
					onChange={(ev: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => setField('subject', ev.target.value)}
				/>
				<TextField
					label={t('mail.composer.textarea.label', 'Write here your message')}
					value={message}
					multiline
					onChange={(ev: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => setField('message', ev.target.value)}
				/>
				<Divider />
			</Paper>
			<Paper
				className={clsx([classes.noRoundCorners, classes.footerContainer])}
			>
				<Button
					variant="contained"
					color="secondary"
					className={classes.button}
					onClick={save}
					endIcon={<Save />}
				>
					{t('mail.composer.draft', 'Draft')}
				</Button>
				<Button
					variant="contained"
					color="primary"
					className={classes.button}
					onClick={send}
					endIcon={<Send />}
				>
					{t('mail.composer.send', 'Send')}
				</Button>
			</Paper>
		</Grid>
	);
};
export default MailComposeView;
