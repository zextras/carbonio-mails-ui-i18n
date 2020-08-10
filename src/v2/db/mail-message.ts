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

import { IMailMinimalData } from './mail-db-types';

interface IMailMessage extends IMailMinimalData {}

export class MailMessage implements IMailMessage {
	_id?: string;

	id?: string;

	parent: string;

	constructor({
		_id,
		id,
		parent,
	}: IMailMessage) {
		this._id = _id;
		this.id = id;
		this.parent = parent;
	}
}
