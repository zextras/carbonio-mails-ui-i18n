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

import React, { FC, ReactElement, useContext } from 'react';
import { Breadcrumbs, Typography } from '@material-ui/core';
import { Link as LinkRouter } from 'react-router-dom';
import MailServiceContext from '../mail/MailServiceContext';
import { reduce } from 'lodash';
import { IMailFolder } from '../sync/IMailSyncService';

interface IMailFolderListViewProps {}

const MailFolderListView: FC<IMailFolderListViewProps> = ({}) => {
	const { currentBreadCrumbs, currentFolder } = useContext(MailServiceContext);

	const breadCrumbs = reduce<IMailFolder, Array<ReactElement>>(
		currentBreadCrumbs,
		(tmpBreadCrumbs, f) => {
			return [...tmpBreadCrumbs, (
				<LinkRouter color="inherit" to={ f.path } key={`folder-${f.id}`}>
					{ f.name }
				</LinkRouter>
				)
			];
		},
		[]
	);
	if (currentFolder) {
		breadCrumbs.push(
			<Typography color="textPrimary" key={currentFolder.path}>
				{ currentFolder.name }
			</Typography>
		);
	}

	return (
		<div>
			{ breadCrumbs.length > 0 ?
				<Breadcrumbs aria-label="breadcrumb">
					{	breadCrumbs }
				</Breadcrumbs>
				:
				null
			}
		</div>
	);
};
export default MailFolderListView;
