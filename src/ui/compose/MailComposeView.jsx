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
import {
	Hidden,
	Paper,
	makeStyles,
	createStyles,
	TextField,
	Button,
	Typography,
	Grid,
} from '@material-ui/core';
import {
	Create,
	Close
} from '@material-ui/icons';
import clsx from 'clsx';
import { truncate } from 'lodash';
import { I18nCtxt } from '@zextras/zapp-shell/context';
import ComposerContext from '../../composer/ComposerContext';
import ComposerContextProvider from '../../composer/ComposerContextProvider';

const MailComposeView = ({ id }) => (
	<ComposerContextProvider convId={id}>
		<MailComposer />
	</ComposerContextProvider>
);

const useStyles = makeStyles((theme) =>
	createStyles({
		composerContainer: {
			height: 'calc(100% - 64px)',
			padding: `0 ${theme.spacing(1)}px`
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
			width: 160,
			borderRadius: 4,
			margin: theme.spacing(1.5),
			marginLeft: 0
		},
		footerContainer: {
			display: 'flex',
			justifyContent: 'flex-end'
		},
		textField: {
			maxHeight: 'calc(100vh - 400px)',
			overflowY: 'auto',
			'& *': {
				color: `${theme.palette.text.primary}!important`
			}
		}
	}));

const MailComposer = () => {
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
				<TextField
					className={classes.textField}
					value={to}
					label={t('mail.composer.to', 'To:')}
					type="email"
					variant="filled"
					margin="dense"
					onChange={(ev) => setField('to', ev.target.value)}
				/>
				<TextField
					className={classes.textField}
					type="email"
					value={cc}
					label={t('mail.composer.cc', 'Cc:')}
					variant="filled"
					margin="dense"
					onChange={(ev) => setField('cc', ev.target.value)}
				/>
				<TextField
					className={classes.textField}
					value={subject}
					label={t('mail.composer.subject', 'Subject:')}
					variant="filled"
					margin="dense"
					onChange={(ev) => setField('subject', ev.target.value)}
				/>
				<TextField
					className={classes.textField}
					label={t('mail.composer.textarea.label', 'Write here your message')}
					value={message}
					multiline
					onChange={(ev) => setField('message', ev.target.value)}
				/>
			</Paper>
			<Paper
				className={clsx([classes.noRoundCorners, classes.footerContainer])}
			>
				<Button
					variant="contained"
					color="primary"
					className={classes.button}
					onClick={save}
				>
					{t('mail.composer.draft', 'Draft')}
				</Button>
				<Button
					variant="contained"
					color="secondary"
					className={classes.button}
					onClick={send}
				>
					{t('mail.composer.send', 'Send')}
				</Button>
			</Paper>
		</Grid>
	);
};
export default MailComposeView;
