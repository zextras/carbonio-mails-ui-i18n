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

import { cloneDeep, forEach, map, filter } from 'lodash';
import { ISyncOperation, ISyncOpRequest } from '@zextras/zapp-shell/lib/sync/ISyncService';
import { ConversationWithMessages, MailMessageWithFolder } from './ConversationFolderCtxt';

export function processOperationsConversation(
	operations: Array<ISyncOperation<any, ISyncOpRequest<any>>>,
	conv: ConversationWithMessages
): [ConversationWithMessages, boolean] {
	const conversation = cloneDeep(conv);
	const messageIds = map(conversation.messages, (message: MailMessageWithFolder) => message.id);
	let modified = false;
	forEach(operations, (operation) => {
		switch (operation.opData.operation) {
			case 'mark-conversation-as-read':
				if (operation.opData.id === conversation.id) {
					conversation.read = operation.opData.read;
					conversation.messages = map(
						conversation.messages,
						(message: MailMessageWithFolder) =>
							({ ...message, read: operation.opData.read })
					);
					modified = true;
				}
				break;
			case 'mark-message-as-read':
				const index = messageIds.indexOf(operation.opData.id);
				if (index > -1) {
					conversation.messages[index].read = operation.opData.read;
					modified = true;
				}
				break;
			default:
				break;
		}
	});
	return [conversation, modified];
}

export function processOperationsList(
	operations: Array<ISyncOperation<any, ISyncOpRequest<any>>>,
	ids: Array<string>,
	folderPath: string
): [Array<string>, boolean] {
	const convIds = [...ids];
	let modified = false;

	forEach(operations, (operation) => {
		const index = convIds.indexOf(operation.opData.id);
		switch (operation.opData.operation) {
			case 'trash-conversation':
				if (index > -1 && folderPath !== '/Trash') {
					convIds.splice(index, 1);
					modified = true;
				}
				else if (index <= -1 && folderPath === '/Trash') {
					convIds.unshift(operation.opData.id);
					modified = true;
				}
				break;
			case 'mark-conversation-as-spam':
				if (index > -1 && folderPath !== '/Junk') {
					convIds.splice(index, 1);
					modified = true;
				}
				else if (index <= -1 && folderPath === '/Junk') {
					convIds.unshift(operation.opData.id);
					modified = true;
				}
				break;
			case 'delete-conversation':
				if (index > -1) {
					convIds.splice(index, 1);
					modified = true;
				}
				break;
			default:
				break;
		}
	});

	return [convIds, modified];
}
