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

import { IFolderSchmV1 } from '@zextras/zapp-shell/lib/sync/IFolderSchm';

export type CreateMailFolderOpReq = {
	folder: {
		view: 'message';
		l: string;
		name: string;
	};
};

export type MoveMailFolderActionOpReq = {
	action: {
		l: string;
		id: string;
		op: 'move';
	};
};

export type RenameMailFolderActionOpReq = {
	action: {
		name: string;
		id: string;
		op: 'rename';
	};
};

export type DeleteMailFolderActionOpReq = {
	action: {
		id: string;
		op: 'delete';
	};
};

export type EmptyMailFolderActionOpReq = {
	action: {
		id: string;
		op: 'empty';
		recursive: true;
	};
};

export function calculateAbsPath(
	id: string,
	name: string,
	fMap: {[id: string]: IFolderSchmV1},
	parentId?: string
): string {
	let mName = name;
	let mParentId = parentId;
	if (fMap[id]) {
		mName = fMap[id].name;
		mParentId = fMap[id].parent;
	}

	if (!mParentId || mParentId === '1' || !fMap[mParentId]) {
		return `/${mName}`;
	}

	return `${calculateAbsPath(mParentId, fMap[mParentId].name, fMap, fMap[mParentId].parent)}/${mName}`;
}
