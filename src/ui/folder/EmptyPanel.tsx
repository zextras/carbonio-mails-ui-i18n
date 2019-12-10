import React, { FC } from 'react';
import { Grid, makeStyles, createStyles, Theme, Typography } from "@material-ui/core";
import { MailOutline } from '@material-ui/icons';

const useStyles = makeStyles((theme: Theme) =>
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
			height: theme.spacing(12),
			color: theme.palette.grey[500]
		}
	}));

const EmptyPanel: FC<{ path: string }> = ({ path }) => {
	const classes = useStyles();
	return (
		<Grid item md={6} className={classes.emptyContainer}>
			<MailOutline className={classes.centralIcon} />
			<Typography variant="subtitle1" color="textSecondary" style={{ whiteSpace: 'pre-line' }}>
				{`Select an email to read it\nor click "Create" button to write a new email.`}
			</Typography>
		</Grid>
	);
}

export default EmptyPanel;
