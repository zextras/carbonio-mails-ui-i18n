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
import { IncompleteMessage, MailMessage } from './mail-message';
import { Participant } from './participant';

export type Conversation = {
	readonly id: string;
	date: number;
	msgCount: number;
	unreadMsgCount: number;
	messages: IncompleteMessage[];
	participants: Participant[];
	subject: string;
	fragment: string;
	read: boolean;
	attachment: boolean;
	flagged: boolean;
	urgent: boolean;
	tags: string[];
	// parent: string[];
}
