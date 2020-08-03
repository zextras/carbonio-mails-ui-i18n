/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */
import { setMainMenuItems } from '@zextras/zapp-shell';
import { reduce } from 'lodash';
import { MailsFolder } from './db/mails-folder';
import { MailsDb } from './db/mails-db';

type MainMenuItem = {
	id: string;
	label: string;
	to: string;
	children?: MainMenuItem[];
};

function buildMenuItem(folder: MailsFolder, db: MailsDb): Promise<MainMenuItem> {
	return db.getFolderChildren(folder)
		.then(
			(children) => Promise.all(
				reduce<MailsDb, Promise<MainMenuItem>[]>(
					children,
					(r, v, k) => {
						r.push(buildMenuItem(v, db));
						return r;
					},
					[]
				)
			)
		)
		.then((children) => {
			if (children.length > 0) {
				return {
					id: `mails-folder-${folder.id}`,
					label: folder.name,
					to: `/folder/${folder.id}`,
					children
				};
			}
			return {
				id: `mails-folder-${folder.id}`,
				label: folder.name,
				to: `/folder/${folder.id}`
			};
		});
}

export default function mainMenuItems(folders: MailsFolder[], db: MailsDb): void {
	Promise.all(
		reduce<MailsFolder, Promise<MainMenuItem>[]>(
			folders,
			(r, v, k) => {
				r.push(buildMenuItem(v, db));
				return r;
			},
			[]
		),
	)
		.then((children) => {
			setMainMenuItems([{
				id: 'mails-main',
				icon: 'EmailOutline',
				to: '/folder/2', // Default route to `Inbox`
				label: 'Mails',
				children
			}]);
		});
}
