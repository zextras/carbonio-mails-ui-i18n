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

import { ISyncOperation, ISyncOpRequest, ISyncOpSoapRequest } from '@zextras/zapp-shell/lib/sync/ISyncService';
import { fcSink, fc } from '@zextras/zapp-shell/fc';
import {
	reduce,
	filter as loFilter,
	cloneDeep,
	forEach,
	without,
	merge,
	map,
	orderBy,
    uniqBy
} from 'lodash';
import {
	CreateMailFolderOp,
	DeleteConversationOp,
	DeleteMailFolderOp,
	EmptyMailFolderOp,
	IMailsService,
	MailFolderOp,
	MarkConversationAsReadOp,
	MarkMessageAsReadOp,
	MarkConversationAsSpamOp,
	MoveMailFolderOp,
	RenameMailFolderOp,
	TrashConversationOp
} from './IMailsService';
import { IMailsIdbService } from './idb/IMailsIdbService';
import {
	calculateAbsPath,
	CreateMailFolderOpReq,
	DeleteConversationOpReq,
	DeleteMailFolderActionOpReq,
	EmptyMailFolderActionOpReq,
	MarkConversationAsReadOpReq,
	MarkMessageAsReadOpReq,
	MarkConversationAsSpamOpReq,
	MoveMailFolderActionOpReq,
	RenameMailFolderActionOpReq,
	TrashConversationOpReq
} from './ISoap';
import { Conversation, IMailFolderSchmV1, MailMessage } from './idb/IMailsIdb';
import { IMailsNetworkService } from './network/IMailsNetworkService';
import { ConversationWithMessages, MailMessageWithFolder } from './context/ConversationFolderCtxt';
import { filter } from 'rxjs/operators';

export const _CONVERSATION_UPDATED_EV_REG = /mails:updated:conversation/;
export const _MESSAGE_UPDATED_EV_REG = /mails:updated:message/;
export const _CONVERSATION_DELETED_EV_REG = /mails:deleted:conversation/;
export const _MESSAGE_DELETED_EV_REG = /mails:deleted:message/;

export default class MailsService implements IMailsService {
	private _createId = 0;

	// public conversations: {[id: string]: BehaviorSubject<Conversation[]>} = {};

	constructor(
		private _idbSrvc: IMailsIdbService,
		private _networkSrvc: IMailsNetworkService
	) {
		// fc
		// 	.pipe(filter((e) => _CONVERSATION_UPDATED_EV_REG.test(e.event)))
		// 	.subscribe(({ data }) => this._updateConversation(data.id));
		// fc
		// 	.pipe(filter((e) => _MESSAGE_UPDATED_EV_REG.test(e.event)))
		// 	.subscribe(({ data }) => console.log('Message updated:', data));
	}

	public getFolderByPath(path: string): Promise<IMailFolderSchmV1> {
		return this._idbSrvc.getFolderByPath(path)
			.catch(
				(e) => this._networkSrvc.fetchFolderByPath(path)
					.then((f) => this._idbSrvc.saveFolderData({ ...f, synced: f.id === '2' }))
			);
	}

	public getFolderById(id: string): Promise<IMailFolderSchmV1> {
		return this._idbSrvc.getFolderById(id)
			.catch(
				(e) => this._networkSrvc.fetchFolderById(id)
					.then((f) => this._idbSrvc.saveFolderData({ ...f, synced: f.id === '2' }))
			);
	}

	/*
	public createFolder(name: string, parent = '7'): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fcSink<ISyncOperation<CreateMailFolderOp, ISyncOpSoapRequest<CreateMailFolderOpReq>>>(
				'sync:operation:push',
				{
					description: 'Creating a mail folder',
					opData: {
						operation: 'create-mail-folder',
						id: `${this._createId -= 1}`,
						name,
						parent
					},
					opType: 'soap',
					request: {
						command: 'CreateFolder',
						urn: 'urn:zimbraMail',
						data: {
							folder: {
								l: parent,
								name,
								view: 'message'
							}
						}
					}
				}
			);
			resolve();
		});
	}

	public moveFolder(id: string, newParent: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fcSink<ISyncOperation<MoveMailFolderOp, ISyncOpSoapRequest<MoveMailFolderActionOpReq>>>(
				'sync:operation:push',
				{
					description: 'Moving mail folder',
					opData: {
						operation: 'move-mail-folder',
						parent: newParent,
						id
					},
					opType: 'soap',
					request: {
						command: 'FolderAction',
						urn: 'urn:zimbraMail',
						data: {
							action: {
								op: 'move',
								id,
								l: newParent
							}
						}
					}
				}
			);
			resolve();
		});
	}

	public renameFolder(id: string, name: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fcSink<ISyncOperation<RenameMailFolderOp, ISyncOpSoapRequest<RenameMailFolderActionOpReq>>>(
				'sync:operation:push',
				{
					description: 'Renaming a mail folder',
					opData: {
						operation: 'rename-mail-folder',
						name,
						id
					},
					opType: 'soap',
					request: {
						command: 'FolderAction',
						urn: 'urn:zimbraMail',
						data: {
							action: {
								op: 'rename',
								id,
								name
							}
						}
					}
				}
			);
			resolve();
		});
	}

	public deleteFolder(id: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fcSink<ISyncOperation<DeleteMailFolderOp, ISyncOpSoapRequest<DeleteMailFolderActionOpReq>>>(
				'sync:operation:push',
				{
					description: 'Deleting a mail folder',
					opData: {
						operation: 'delete-mail-folder',
						id
					},
					opType: 'soap',
					request: {
						command: 'FolderAction',
						urn: 'urn:zimbraMail',
						data: {
							action: {
								op: 'delete',
								id
							}
						}
					}
				}
			);
			resolve();
		});
	}

	public emptyFolder(id: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fcSink<ISyncOperation<EmptyMailFolderOp, ISyncOpSoapRequest<EmptyMailFolderActionOpReq>>>(
				'sync:operation:push',
				{
					description: 'Cleaning a mail folder',
					opData: {
						operation: 'empty-mail-folder',
						id
					},
					opType: 'soap',
					request: {
						command: 'FolderAction',
						urn: 'urn:zimbraMail',
						data: {
							action: {
								op: 'empty',
								id,
								recursive: true
							}
						}
					}
				}
			);
			resolve();
		});
	}

	public moveConversationToTrash(id: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fcSink<ISyncOperation<TrashConversationOp, ISyncOpSoapRequest<TrashConversationOpReq>>>(
				'sync:operation:push',
				{
					description: 'Moving a conversation to trash',
					opData: {
						operation: 'trash-conversation',
						id
					},
					opType: 'soap',
					request: {
						command: 'ConvAction',
						urn: 'urn:zimbraMail',
						data: {
							action: {
								op: 'trash',
								tcon: '-dtjs',
								id
							}
						}
					}
				}
			);
			resolve();
		});
	}

	public markConversationAsRead(id: string, read: boolean): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fcSink<ISyncOperation<
				MarkConversationAsReadOp,
				ISyncOpSoapRequest<MarkConversationAsReadOpReq>
			>>(
				'sync:operation:push',
				{
					description: `Marking a conversation as ${read ? '' : 'un'}read`,
					opData: {
						operation: 'mark-conversation-as-read',
						id,
						read
					},
					opType: 'soap',
					request: {
						command: 'ConvAction',
						urn: 'urn:zimbraMail',
						data: {
							action: {
								op: read ? 'read' : '!read',
								id
							}
						}
					}
				}
			);
			resolve();
		});
	}
	*/

	public markMessageAsRead(id: string, read: boolean): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fcSink<ISyncOperation<MarkMessageAsReadOp, ISyncOpSoapRequest<MarkMessageAsReadOpReq>>>(
				'sync:operation:push',
				{
					description: `Marking a message as ${read ? '' : 'un'}read`,
					opData: {
						operation: 'mark-message-as-read',
						id,
						read
					},
					opType: 'soap',
					request: {
						command: 'MsgAction',
						urn: 'urn:zimbraMail',
						data: {
							action: {
								op: read ? 'read' : '!read',
								id
							}
						}
					}
				}
			);
			resolve();
		});
	}

	/*
	public deleteConversation(id: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fcSink<ISyncOperation<DeleteConversationOp, ISyncOpSoapRequest<DeleteConversationOpReq>>>(
				'sync:operation:push',
				{
					description: 'Deleting a conversation',
					opData: {
						operation: 'delete-conversation',
						id,
					},
					opType: 'soap',
					request: {
						command: 'ConvAction',
						urn: 'urn:zimbraMail',
						data: {
							action: {
								op: 'delete',
								tcon: '-t',
								id
							}
						}
					}
				}
			);
			resolve();
		});
	}

	public markConversationAsSpam(id: string, spam: boolean): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fcSink<ISyncOperation<MarkConversationAsSpamOp, ISyncOpSoapRequest<MarkConversationAsSpamOpReq>>>(
				'sync:operation:push',
				{
					description: 'Marking conversation as spam',
					opData: {
						operation: 'mark-conversation-as-spam',
						id,
					},
					opType: 'soap',
					request: {
						command: 'ConvAction',
						urn: 'urn:zimbraMail',
						data: {
							action: {
								op: spam ? 'spam' : '!spam',
								tcon: '-dtjs',
								id
							}
						}
					}
				}
			);
			resolve();
		});
	}

	public saveDraft(msg: MailMessage): Promise<MailMessage> {
		return Promise.reject(new Error('Method not implemented'));
	}

	public addAttachment(msg: MailMessage, file: File): Promise<MailMessage> {
		return Promise.reject(new Error('Method not implemented'));
	}

	public sendMessage(msg: MailMessage): Promise<MailMessage> {
		return Promise.reject(new Error('Method not implemented'));
	}
	*/

	/*
	private _updateConversation(id: string): void {
		this.getConversation(id)
			.then((c) => {
				forEach(
					c.parent,
					(fId: string) => {
						if (!this.conversations[fId]) {
							this.conversations[fId] = new BehaviorSubject<Conversation[]>([]);
						}
						this._idbSrvc.fetchConversationsFromFolder(id)
							.then((convs) => this.conversations[id].next(convs));
					}
				);
			});
	}
	*/

	public getFolderConversations(path: string, resolveMails: boolean, loadMore: boolean): Promise<[string[], { [id: string]: Conversation|ConversationWithMessages }]> {
		return this._idbSrvc.getFolderByPath(path)
			.catch(
				(e) => this._networkSrvc.fetchFolderByPath(path)
					.then((f) => this._idbSrvc.saveFolderData({ ...f, synced: f.id === '2' }))
			)
			.then((f): Promise<[Conversation[], IMailFolderSchmV1]> => this._idbSrvc.fetchConversationsFromFolder(f.id).then((convs) => ([convs, f])))
			.then(([convs, f]: [Conversation[], IMailFolderSchmV1]): Conversation[]|Promise<Conversation[]> => {
				if (loadMore) return this._networkSrvc.fetchConversationsInFolder(f.id, 50)
					.then((c) => Promise.all(
						map(
							c,
							(v, k) => this._idbSrvc.saveConversation(v)
						)
					).then(() => uniqBy([...c, ...convs], 'id')));
				return convs;
			})
			.then((convs): Conversation[]|Promise<ConversationWithMessages[]> => {
				if (resolveMails && convs.length > 0) return this._resolveConversationsMails(convs);
				return convs;
			})
			.then((convs) => orderBy<Conversation|ConversationWithMessages>(convs, ['date'], ['desc']))
			.then((convs) => reduce<Conversation|ConversationWithMessages, [string[], { [id: string]: Conversation|ConversationWithMessages }]>(
				convs,
				([ids, collector], v, k) => [
					[
						...ids,
						v.id
					],
					{
						...collector,
						[v.id]: v
					}
				],
				[[], {}]
			));
	}

	private _resolveConversationsMails(convs: Conversation[]): Promise<ConversationWithMessages[]> {
		if (convs.length === 1) {
			return this._resolveConversationMails(convs[0])
				.then((c) => ([c]));
		}
		if (convs.length > 1) {
			const clonedConvs = [...convs];
			const conv = clonedConvs.pop();
			return Promise.all([
				this._resolveConversationMails(conv!),
				this._resolveConversationsMails(clonedConvs)
			]).then(
				([c1, c2]) => ([c1, ...c2])
			);
		}
		throw new Error('Wrong parameters');
	}

	private _resolveConversationMails(conv: Conversation): Promise<ConversationWithMessages> {
		return (this.getMessages(map(conv.messages, 'id'), true) as Promise<{[p: string]: MailMessageWithFolder}>)
			.then((messages: {[p: string]: MailMessageWithFolder}) => ({
				...conv,
				messages: orderBy<MailMessageWithFolder>(
					map(messages),
					['date'],
					['desc']
				)
			}));
	}

	public getConversation(id: string, resolveMails: boolean): Promise<Conversation|ConversationWithMessages> {
		return this._idbSrvc.getConversation(id)
			.then((conv) => {
				if (conv) return conv;
				return this._networkSrvc.fetchConversations([id])
					.then(([conv1]: Conversation[]) => {
						if (!conv1) throw new Error(`Conversation '${id}' not found`);
						return this._idbSrvc.saveConversation(conv1);
					});
			})
			.then((conv): Conversation|Promise<ConversationWithMessages> => {
				if (resolveMails)	return this._resolveConversationsMails([conv]).then(([c]) => c);
				return conv;
			});
	}

	public getMessages(msgIds: string[], resolveFolders: boolean): Promise<{[id: string]: MailMessage|MailMessageWithFolder}> {
		return this._idbSrvc.getMessages(msgIds)
			.then(
				(msgs: {[id: string]: MailMessage}) =>
					this._networkSrvc.fetchMailMessages(
						without(
							msgIds,
							...reduce<{[v: string]: MailMessage}, string[]>(
								msgs,
								(r, v, k) => {
									r.push(v.id);
									return r;
								},
								[]
							)
						)
					)
						.then(
							(messages) => this._idbSrvc.saveMailMessages(messages)
								.then((savedMsgs) => [msgs, reduce<MailMessage, {[id: string]: MailMessage}>(
									savedMsgs,
									(r, v, k) => ({ ...r,	[v.id]: v	}),
									{}
								)])
						)
						.then(([fromIdb, fromNetwork]) => merge(
							fromIdb,
							fromNetwork
						))
						.then((msgsMap) => (resolveFolders ? this._resolveMailsFolders(msgsMap) : msgsMap))
			);
	}

	private _resolveMailsFolders(msgs: {[id: string]: MailMessage}): Promise<{[id: string]: MailMessageWithFolder}> {
		return Promise.all(
			map(
				msgs,
				(v, k) => this._resolveMailFolder(v)
			)
		)
			.then((res) => reduce<MailMessageWithFolder, {[id: string]: MailMessageWithFolder}>(
				res,
				(r, v, k) => ({ ...r,	[v.id]: v	}),
				{}
			));
	}

	private _resolveMailFolder(msg: MailMessage): Promise<MailMessageWithFolder> {
		return this.getFolderById(msg.parent)
			.then((f): MailMessageWithFolder => ({
				...msg,
				folder: f
			}));
	}
}
