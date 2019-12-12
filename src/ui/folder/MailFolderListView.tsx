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
	ReactElement,
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
	Theme,
	Typography,
	Paper,
	Divider
} from '@material-ui/core';
import { Link as LinkRouter } from 'react-router-dom';
import { reduce } from 'lodash';
import { Subscription } from 'rxjs';
import { IMailFolder } from '../../sync/IMailSyncService';
import MailListViewItem from './MailListViewItem';
import { IConvSchm } from '../../idb/IMailSchema';
import { IMailServicesContext } from '../../context/IMailServicesContext';
import MailServicesContext from '../../context/MailServicesContext';

const useStyles = makeStyles((theme: Theme) =>
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
		}
	}));

const InternalMailFolderListView: FC<{ conversations: Array<IConvSchm>; path: string }> = ({ conversations, path }) => {
	const classes = useStyles();
	return (
		<Grid>
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
					<Divider />
				</LinkRouter>
			))}
		</Grid>
	);
};

interface IMailFolderListViewProps {
	path: string;
}

const MailFolderListView: FC<IMailFolderListViewProps> = ({ path }) => {
	const [[currentFolder, breadcrumbs], setBreadCrumbsAndCurrentFolder] = useState<[IMailFolder|undefined, Array<IMailFolder>]>([undefined, []]);
	const [conversations, setConversations] = useState<Array<IConvSchm>>([]);
	const ref = useRef<Subscription>();
	const { syncSrvc, mailSrvc } = useContext<IMailServicesContext>(MailServicesContext);
	const classes = useStyles();
	useEffect(() => {
		if (currentFolder && syncSrvc) {
			ref.current = syncSrvc.getFolderContent(currentFolder.path).subscribe(
				(c) => setConversations(c)
			);
		}
		return (): void => {
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

	const breadCrumbs = reduce<IMailFolder, Array<ReactElement>>(
		breadcrumbs,
		(tmpBreadCrumbs, f) => [...tmpBreadCrumbs, (
			<LinkRouter color="inherit" to={`/mail/folder${f.path}`} key={`folder-${f.id}`}>
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
		<Grid item xs={12} md={6}>
			<Paper className={classes.breadcrumbsContainer}>
				<Breadcrumbs aria-label="breadcrumb">
					{ breadCrumbs }
				</Breadcrumbs>
			</Paper>
			<Divider />
			<InternalMailFolderListView
				conversations={conversations}
				path={path}
			/>
		</Grid>
	);
};
export default MailFolderListView;
