/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

export default class MailsFolder {
	id: string;

	uuid: string;

	name: string;

	path: string;

	parent: string;

	parentUuid: string;

	unreadCount: number;

	size: number;

	itemsCount: number;

	synced: boolean;

	constructor({
		itemsCount = 0, name, id, path, parent, unreadCount = 0, size = 0, uuid, parentUuid
	}: {
		itemsCount: number; name: string; id: string; path: string; unreadCount: number;
		size: number; parent: string; parentUuid: string; uuid: string;
	}) {
		this.itemsCount = itemsCount;
		this.name = name;
		this.id = id;
		this.path = path;
		this.parent = parent;
		this.unreadCount = unreadCount;
		this.size = size;
		this.uuid = uuid;
		this.parentUuid = parentUuid;
		this.synced = true;
	}
}
