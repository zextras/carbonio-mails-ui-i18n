import React from 'react';
import { Grid, makeStyles, createStyles, Theme, Typography } from '@material-ui/core';
import { MailOutline } from '@material-ui/icons';
import clsx from 'clsx';

const useStyles = makeStyles((theme) =>
	createStyles({
		emptyContainer: {
			height: '90vh',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			textAlign: 'center'
		},
		centralIcon: {
			width: theme.spacing(12),
			height: theme.spacing(12)
		},
		grey: {
			color: theme.palette.grey[500]
		}
	}));

const EmptyPanel = ({ path }) => {
	const classes = useStyles();
	return (
		<Grid item md={6} className={classes.emptyContainer}>
			<MailOutline className={clsx(classes.centralIcon, classes.grey)} />
			<Typography className={classes.grey} variant="body1" style={{ whiteSpace: 'pre-line' }}>
				{'Select an email to read it\nor click the "Create" button\nto write a new email.'}
			</Typography>
		</Grid>
	);
};
export default EmptyPanel;
