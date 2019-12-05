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
import {
	Avatar,
	createStyles,
	Grid,
	GridListTile, ListItem,
	makeStyles,
	Theme,
	Typography
} from '@material-ui/core';
import { RadioButtonUnchecked } from '@material-ui/icons';
import { IConvSchm } from '../idb/IMailSchema';

const useStyles = makeStyles((theme: Theme) =>
	createStyles({
		root: {
			width: '100%',
			backgroundColor: theme.palette.background.paper,
		},
		inline: {
			display: 'inline',
		},
	}),
);

interface IMailListViewItemProps {
	conversation: IConvSchm;
}

const MailListViewItem: FC<IMailListViewItemProps> = ({ conversation }) => {
	return (
		<ListItem>
			{conversation.fragment}
		</ListItem>
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
