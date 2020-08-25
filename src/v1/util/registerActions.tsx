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
import { registerItemAction } from '@zextras/zapp-shell/itemActions';
import {
	forEach,
	reduce,
	find,
	filter
} from 'lodash';
import { IMailsService } from '../../IMailsService';
import { MailMessageWithFolder } from '../context/ConversationFolderCtxt';

export default function registerActions(mailsSrvc: IMailsService): void {
	registerItemAction('conversation-list', {
		id: 'conversation-move-to-trash',
		icon: 'TrashOutline',
		label: 'Move to Trash',
		onActivate: (items: any): void => {
			forEach(
				items,
				(c) => mailsSrvc.moveConversationToTrash(c.value.id)
			);
		},
		onCheck: (items: any) => Promise.resolve(items.length > 0)
	});
	registerItemAction('conversation-list', {
		id: 'conversation-mark-as-read',
		icon: 'EyeOutline',
		label: 'Mark as Read',
		onActivate: (items: any): void => {
			forEach(
				items,
				(c) => mailsSrvc.markConversationAsRead(c.value.id, true)
			);
		},
		onCheck: (items: any) => Promise.resolve(
			items.length > 0
			&& reduce<any, boolean>(items, (acc, c) => acc || !c.value.read, false)
		),
	});
	registerItemAction('conversation-list', {
		id: 'conversation-mark-as-unread',
		icon: 'EyeOff2Outline',
		label: 'Mark as Unread',
		onActivate: (items: any): void => {
			forEach(
				items,
				(c) => mailsSrvc.markConversationAsRead(c.value.id, false)
			);
		},
		onCheck: (items: any) => Promise.resolve(
			items.length > 0
			&& !reduce<any, boolean>(items, (acc, c) => acc || !c.value.read, false)
		),
	});
	registerItemAction('conversation-list', {
		id: 'conversation-mark-as-spam',
		icon: 'SlashOutline',
		label: 'Mark as Spam',
		onActivate: (items: any) => {
			forEach(
				items,
				(c) => mailsSrvc.markConversationAsSpam(c.value.id, true)
			);
		},
		onCheck: (items: any) => Promise.resolve(items.length > 0
		&& reduce<any, boolean>(items, (acc, c) => acc || !find(c.value.parent, '4'), false)),
	});
	registerItemAction('conversation-list', {
		id: 'conversation-unmark-as-spam',
		icon: 'CheckmarkCircle2Outline',
		label: 'Remove from Spam',
		onActivate: (items: any) => {
			forEach(
				items,
				(c) => mailsSrvc.markConversationAsSpam(c.value.id, true)
			);
		},
		onCheck: (items: any) => {
			return Promise.resolve(items.length > 0
				&& reduce<any, boolean>(
					items,
					(acc, c) => acc && filter(
						c.value.parent,
						(p) => p !== '4'
					).length === 0,
					true
				));
		},
	});
	registerItemAction('mail-message', {
		id: 'mail-move-to-trash',
		icon: 'TrashOutline',
		label: 'Move to Trash',
		onActivate: (m: MailMessageWithFolder): void => {
			mailsSrvc.moveMessageToTrash(m.id);
		},
		onCheck: (m: MailMessageWithFolder) => Promise.resolve(m.parent !== '3')
	});
	registerItemAction('mail-message', {
		id: 'mail-mark-as-read',
		icon: 'EyeOutline',
		label: 'Mark as Read',
		onActivate: (m: MailMessageWithFolder): void => {
			mailsSrvc.markMessageAsRead(m.id, true);
		},
		onCheck: (m: MailMessageWithFolder) => Promise.resolve(!m.read)
	});
	registerItemAction('mail-message', {
		id: 'mail-mark-as-unread',
		icon: 'EyeOff2Outline',
		label: 'Mark as Unread',
		onActivate: (m: MailMessageWithFolder): void => {
			mailsSrvc.markMessageAsRead(m.id, false);
		},
		onCheck: (m: MailMessageWithFolder) => Promise.resolve(m.read)
	});
	registerItemAction('mail-message', {
		id: 'mail-mark-as-spam',
		icon: 'SlashOutline',
		label: 'Mark as Spam',
		onActivate: (m: MailMessageWithFolder) => {
			mailsSrvc.markMessageAsSpam(m.id, true);
		},
		onCheck: (m: MailMessageWithFolder) => Promise.resolve(m.parent !== '4')
	});
	registerItemAction('mail-message', {
		id: 'mail-unmark-as-spam',
		icon: 'CheckmarkCircle2Outline',
		label: 'Remove from Spam',
		onActivate: (m: MailMessageWithFolder) => {
			mailsSrvc.markMessageAsSpam(m.id, false);
		},
		onCheck: (m: MailMessageWithFolder) => Promise.resolve(m.parent === '4')
	});
}
