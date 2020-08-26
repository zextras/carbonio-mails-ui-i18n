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

import {
	cloneDeep,
	filter,
	findIndex,
	forEach,
	map,
	uniq
} from 'lodash';
import { ISyncOperation, ISyncOpRequest } from '@zextras/zapp-shell/lib/sync/ISyncService';
import { ConversationWithMessages, MailMessageWithFolder } from './ConversationFolderCtxt';
import { IMailsService } from '../../IMailsService';

export function processOperationsConversation(
	operations: Array<ISyncOperation<any, ISyncOpRequest<any>>>,
	conv: ConversationWithMessages,
	mailsSrvc: IMailsService
): Promise<[ConversationWithMessages, boolean]> {
	const conversation = cloneDeep(conv);
	const messageIds = map(conversation.messages, (message: MailMessageWithFolder) => message.id);
	let modified = false;
	const promises: Array<Promise<any>> = [];
	forEach(operations, (operation) => {
		switch (operation.opData.operation) {
			case 'mark-conversation-as-read': {
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
			}
			case 'mark-message-as-read': {
				const index = messageIds.indexOf(operation.opData.id);
				if (index > -1) {
					conversation.messages[index].read = operation.opData.read;
					let convRead = true;
					forEach(
						conversation.messages,
						(message) => {
							if (!message.read) {
								convRead = false;
							}
						}
					);
					conversation.read = convRead;
					modified = true;
				}
				break;
			}
			case 'trash-conversation': {
				if (conversation.id === operation.opData.id) {
					conversation.parent = ['3'];
					forEach(
						conversation.messages,
						(message, msgIndex) => {
							conversation.messages[msgIndex].parent = '3';
							promises.push(
								mailsSrvc.getFolderById('3')
									.then((folder) => {
										conversation.messages[msgIndex].folder = folder;
									})
							);
						}
					);
					modified = true;
				}
				break;
			}
			case 'mark-conversation-as-spam': {
				if (conversation.id === operation.opData.id) {
					conversation.parent = ['4'];
					forEach(
						conversation.messages,
						(message, msgIndex) => {
							conversation.messages[msgIndex].parent = '4';
							promises.push(
								mailsSrvc.getFolderById('4')
									.then((folder) => {
										conversation.messages[msgIndex].folder = folder;
									})
							);
						}
					);
					modified = true;
				}
				break;
			}
			case 'trash-message': {
				const index = messageIds.indexOf(operation.opData.id);
				if (index > -1) {
					conversation.messages[index].parent = '3';
					if (!filter(conversation.messages, (msg) => msg.parent !== '3').length) {
						conversation.parent = ['3'];
					}
					else {
						conversation.parent = uniq([...conversation.parent, '3']);
					}
					promises.push(
						mailsSrvc.getFolderById('3')
							.then((folder) => {
								conversation.messages[index].folder = folder;
							})
					);
					modified = true;
				}
				break;
			}
			case 'mark-message-as-spam': {
				const index = messageIds.indexOf(operation.opData.id);
				if (index > -1) {
					conversation.messages[index].parent = '4';
					if (!filter(conversation.messages, (msg) => msg.parent !== '4').length) {
						conversation.parent = ['4'];
					}
					else {
						conversation.parent = uniq([...conversation.parent, '4']);
					}
					promises.push(
						mailsSrvc.getFolderById('4')
							.then((folder) => {
								conversation.messages[index].folder = folder;
							})
					);
					modified = true;
				}
				break;
			}
			default:
				break;
		}
	});
	return Promise.all(promises).then(() => [conversation, modified]);
}

export function processOperationsList(
	operations: Array<ISyncOperation<any, ISyncOpRequest<any>>>,
	ids: Array<string>,
	convMapInput: { [id: string]: ConversationWithMessages },
	folderId: string
): [Array<string>, boolean] {
	const convIds = [...ids];
	const convMap = { ...convMapInput };
	let modified = false;

	forEach(operations, (operation) => {
		const index = convIds.indexOf(operation.opData.id);
		switch (operation.opData.operation) {
			case 'trash-conversation': {
				if (index > -1 && folderId !== '3') {
					convIds.splice(index, 1);
					modified = true;
				}
				else if (index <= -1 && folderId === '3') {
					convIds.unshift(operation.opData.id);
					modified = true;
				}
				break;
			}
			case 'mark-conversation-as-spam': {
				if (index > -1 && folderId !== '4') {
					convIds.splice(index, 1);
					modified = true;
				}
				else if (index <= -1 && folderId === '4') {
					convIds.unshift(operation.opData.id);
					modified = true;
				}
				break;
			}
			case 'delete-conversation': {
				if (index > -1) {
					convIds.splice(index, 1);
					modified = true;
				}
				break;
			}
			case 'trash-message': {
				const convsWithTrashedMessage = filter(convMap, (conv) => findIndex(conv.messages, ['id', operation.opData.id]) > -1);
				if (convsWithTrashedMessage.length > 0) {
					forEach(convsWithTrashedMessage, (conv) => {
						if (folderId !== '3') {
							const parents = uniq(map(
								filter(conv.messages, (message) => message.id !== operation.opData.id),
								(message) => message.parent
							));
							if (!parents.includes(folderId)) {
								convIds.splice(convIds.indexOf(conv.id), 1);
							}
						}
						else {
							convIds.unshift(conv.id);
						}
					});
					modified = true;
				}
				break;
			}
			case 'mark-message-as-spam': {
				const convsWithSpamMessage = filter(convMap, (conv) => findIndex(conv.messages, ['id', operation.opData.id]) > -1);
				if (convsWithSpamMessage.length > 0) {
					forEach(convsWithSpamMessage, (conv) => {
						if (folderId !== '4') {
							const parents = uniq(map(
								filter(conv.messages, (message) => message.id !== operation.opData.id),
								(message) => message.parent
							));
							if (!parents.includes(folderId)) {
								convIds.splice(convIds.indexOf(conv.id), 1);
							}
						}
						else {
							convIds.unshift(conv.id);
						}
					});
					modified = true;
				}
				break;
			}
			default:
				break;
		}
	});

	return [convIds, modified];
}
