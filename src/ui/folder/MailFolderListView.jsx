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
	useContext,
	useEffect,
	useRef,
	useState
} from 'react';
import {
	Breadcrumbs,
	createStyles,
	Grid,
	makeStyles,
	Typography,
	Paper,
} from '@material-ui/core';
import { Link as LinkRouter } from 'react-router-dom';
import { reduce } from 'lodash';
import MailListViewItem from './MailListViewItem';
import MailServicesContext from '../../context/MailServicesContext';

const useStyles = makeStyles((theme) =>
	createStyles({
		breadcrumbsContainer: {
			borderRadius: 0,
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-start',
			height: theme.spacing(6),
			padding: theme.spacing(1.5)
		},
		routerLink: {
			textDecoration: 'none'
		},
		listContainer: {
		},
		innerListContainer: {
			height: 'calc(100vh - 112px)',
			overflowY: 'auto',
		}
	}));

const InternalMailFolderListView = ({ conversations, path }) => {
	const classes = useStyles();
	return (
		<Grid className={classes.innerListContainer}>
			{conversations.map((conv) => (
				<LinkRouter
					key={conv.id}
					to={{
						pathname: `/mail/${path === 'Drafts' ? 'compose' : 'view'}/${conv.id}`,
						state: { conv, from: path }
					}}
					className={classes.routerLink}
				>
					<MailListViewItem conversation={conv} />
				</LinkRouter>
			))}
		</Grid>
	);
};

const MailFolderListView = ({ path }) => {
	const [[currentFolder, breadcrumbs], setBreadCrumbsAndCurrentFolder] = useState([undefined, []]);
	const [conversations, setConversations] = useState([]);
	const ref = useRef();
	const { syncSrvc, mailSrvc } = useContext(MailServicesContext);
	const classes = useStyles();
	useEffect(() => {
		if (currentFolder && syncSrvc) {
			ref.current = syncSrvc.getFolderContent(currentFolder.path).subscribe(
				(c) => setConversations(c)
			);
		}
		return () => {
			if (ref.current) ref.current.unsubscribe();
		};
	}, [currentFolder, syncSrvc]);

	useEffect(
		() => {
			if (mailSrvc) {
				setBreadCrumbsAndCurrentFolder(
					mailSrvc.getFolderBreadcrumbs(`/${path}`)
				);
			}
		}, [path, mailSrvc]
	);

	const breadCrumbs = reduce(
		breadcrumbs,
		(tmpBreadCrumbs, f) => [...tmpBreadCrumbs, (
			<LinkRouter className={classes.routerLink} color="inherit" to={`/mail/folder${f.path}`} key={`folder-${f.id}`}>
				{ f.name }
			</LinkRouter>
		)],
		[]
	);

	if (!currentFolder) return null;

	breadCrumbs.push(
		<Typography color="textPrimary" key={currentFolder.path}>
			{ currentFolder.name }
		</Typography>
	);

	return (
		<Grid item xs={12} md={6} className={classes.listContainer}>
			<Paper className={classes.breadcrumbsContainer}>
				<Breadcrumbs aria-label="breadcrumb">
					{ breadCrumbs }
				</Breadcrumbs>
			</Paper>
			<InternalMailFolderListView
				conversations={conversations}
				path={path}
			/>
		</Grid>
	);
};
export default MailFolderListView;
