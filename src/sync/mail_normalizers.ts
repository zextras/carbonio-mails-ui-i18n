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

import { pick, map } from 'lodash';
import { IFolder } from './IFolder';

export const normalizeFolder = (entity: any): IFolder => {
	const obj = pick(entity, [
		'id',
		'name',
		'l',
		'folder',
		'absFolderPath',
		'view',
		'n',
		'u'
	]);
	const newObj: IFolder = {
		id: obj.id,
		name: obj.name,
		parent: obj.l,
		path: obj.absFolderPath,
		view: obj.view ? obj.view : 'root',
		itemCount: obj.n ? obj.n : 0,
		unreadCount: obj.u ? obj.u : 0
	};
	if (obj.folder) newObj.folder = map(obj.folder, (f: any) => normalizeFolder(f));
	return newObj;
};
