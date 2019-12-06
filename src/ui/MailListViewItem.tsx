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

import React, { FC } from 'react';
import { find, truncate } from 'lodash';
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
import { RadioButtonUnchecked, RadioButtonChecked, ArrowUpward } from '@material-ui/icons';
import { IConvSchm, IMailContactSchm } from '../idb/IMailSchema';

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
			backgroundColor: `hsl(${Math.round(Math.random() * 360)}, 75%, 50%)`
		},
		textColumn: {
		},
		iconsColumn: {
			height: '100%',
			padding: `${theme.spacing(0.5)}px 0`,
			marginRight: theme.spacing(1),
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'flex-start'
		}
	}));

interface IMailListViewItemProps {
	conversation: IConvSchm;
}

const MailListViewItem: FC<IMailListViewItemProps> = ({ conversation }) => {
	const classes = useStyles();
	const fromContact: IMailContactSchm | undefined = find(conversation.contacts, (c: IMailContactSchm): boolean => c.type === 'from');

	return (
		<Paper
			className={classes.listItemRoot}
		>
			<Avatar
				className={classes.avatarRand}
				style={{ backgroundColor: `hsl(${Math.round(Math.random() * 360)}, 50%, 50%)` }}
			>
				{fromContact ? truncate(fromContact.address, { length: 2, omission: '' }) : '?'}
			</Avatar>
			<Grid className={classes.iconsColumn}>
				{ conversation.read
					? <RadioButtonUnchecked color="primary" />
					: <RadioButtonChecked color="primary" />}
				{ conversation.urgent && <ArrowUpward color="error" /> }
			</Grid>
			<Grid className={classes.textColumn}>
				<Typography variant={conversation.read ? 'body2' : 'subtitle2'}>
					{fromContact && fromContact.address}
				</Typography>
				<Typography variant={conversation.read ? 'body2' : 'subtitle2'}>
					{conversation.subject}
				</Typography>
				<Typography variant="subtitle2">
					{truncate(conversation.fragment, { length: 30, omission: '...' })}
				</Typography>
			</Grid>
		</Paper>
	);

	// {/*<Grid container spacing={2} direction="row">*/}
	// {/*	<Grid item>*/}
	// {/*		<Avatar>H</Avatar>*/}
	// {/*	</Grid>*/}
	// {/*	<Grid item container direction="column">*/}
	// {/*		<Grid item>*/}
	// {/*			<RadioButtonUnchecked />*/}
	// {/*		</Grid>*/}
	// {/*	</Grid>*/}
	// {/*	<Grid item container direction="column">*/}
	// {/*		<Grid item>*/}
	// {/*			<Typography gutterBottom variant="subtitle1">*/}
	// {/*				user@example.com*/}
	// {/*			</Typography>*/}
	// {/*		</Grid>*/}
	// {/*		<Grid item>*/}
	// {/*			<Typography gutterBottom variant="subtitle1">*/}
	// {/*				Subject of the email*/}
	// {/*			</Typography>*/}
	// {/*		</Grid>*/}
	// {/*		<Grid item>*/}
	// {/*			<Typography gutterBottom variant="body2">*/}
	// {/*				This is the fragment of the mail. The fragment should be trimmed by the view as is really really long.*/}
	// {/*			</Typography>*/}
	// {/*		</Grid>*/}
	// {/*	</Grid>*/}
	// {/*	<Grid item container direction="column">*/}
	// {/*		<Grid item>*/}
	// {/*			<Typography gutterBottom variant="subtitle1">*/}
	// {/*				user@example.com*/}
	// {/*			</Typography>*/}
	// {/*		</Grid>*/}
	// {/*	</Grid>*/}
	// {/*</Grid>*/}
};
export default MailListViewItem;
