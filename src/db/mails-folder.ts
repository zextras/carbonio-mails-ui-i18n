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

export interface IMailsFolder {
	/** Internal UUID */ _id?: string;
	/** Zimbra ID */ id?: string;
	itemsCount: number;
	name: string;
	path: string;
	unreadCount: number;
	size: number;
	parent: string;
}

export class MailsFolder implements IMailsFolder {
	itemsCount: number;

	name: string;

	_id?: string;

	id?: string;

	path: string;

	unreadCount: number;

	size: number;

	parent: string;

	constructor({
		itemsCount = 0,
		name,
		id,
		path,
		unreadCount = 0,
		size = 0,
		parent,
		_id
	}: IMailsFolder) {
		this._id = _id;
		this.itemsCount = itemsCount;
		this.name = name;
		this.id = id;
		this.path = path;
		this.unreadCount = unreadCount;
		this.size = size;
		this.parent = parent;
	}
}

export class MailsFolderFromSoap extends MailsFolder {
	id: string;

	constructor({ id, ...rest }: IMailsFolder & { id: string }) {
		super({ ...rest, id });
		this.id = id;
	}
}

export class MailsFolderFromDb extends MailsFolder {
	_id: string;

	constructor({ _id, ...rest }: IMailsFolder & { _id: string }) {
		super({ ...rest, _id });
		this._id = _id;
	}
}
