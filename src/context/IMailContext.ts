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

import { Conversation, MailMessage } from '../idb/IMailsIdb';

interface IMailContext {
	conversations: Array<Conversation>;
	mails: {[id: string]: MailMessage};
	view: Array<string>;
	edit: Array<string>;
	openView: (id: string) => void;
	openEdit: (id: string) => void;
	closeView: (id: string) => void;
	closeEdit: (id: string) => void;
}

export default IMailContext;
