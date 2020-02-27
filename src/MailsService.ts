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
import { IMainSubMenuItemData } from '@zextras/zapp-shell/lib/router/IRouterService';
import { syncOperations } from '@zextras/zapp-shell/sync';
import { BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
	findKey,
	reduce,
	filter as loFilter,
	cloneDeep,
	forEach,
	without,
	merge
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

const _FOLDER_UPDATED_EV_REG = /mails:updated:folder/;
const _FOLDER_DELETED_EV_REG = /mails:deleted:folder/;
const _CONVERSATION_UPDATED_EV_REG = /mails:updated:conversation/;
const _MESSAGE_UPDATED_EV_REG = /mails:updated:message/;

const subfolders: (
	folders: {[id: string]: IMailFolderSchmV1},
	parentId: string
) => Array<IMainSubMenuItemData> = (folders, parentId) =>
	reduce<IMailFolderSchmV1, Array<IMainSubMenuItemData>>(
		loFilter(
			folders,
			(folder: IMailFolderSchmV1): boolean => folder.parent === parentId
		),
		(acc: Array<IMainSubMenuItemData>, folder: IMailFolderSchmV1) => {
			acc.push(
				{
					id: folder.id,
					label: folder.name,
					to: `/mails/folder${folder.path}`,
					children: subfolders(folders, folder.id)
				}
			);
			return acc;
		},
		[]
	);

export default class MailsService implements IMailsService {
	public folders = new BehaviorSubject<{[id: string]: IMailFolderSchmV1}>({});

	private _folders = new BehaviorSubject<{[id: string]: IMailFolderSchmV1}>({});

	public menuFolders = new BehaviorSubject<Array<IMainSubMenuItemData>>([]);

	private _menuFoldersSub: Subscription;

	private _createId = 0;

	public conversations: {[id: string]: BehaviorSubject<Conversation[]>} = {};

	constructor(
		private _idbSrvc: IMailsIdbService,
		private _networkSrvc: IMailsNetworkService
	) {
		fc
			.pipe(
				filter((e) => e.event === 'app:all-loaded')
			)
			.subscribe(() => this._loadAllMailFolders());
		fc
			.pipe(filter((e) => _FOLDER_UPDATED_EV_REG.test(e.event)))
			.subscribe(({ data }) => this._updateFolder(data.id));
		fc
			.pipe(filter((e) => _FOLDER_DELETED_EV_REG.test(e.event)))
			.subscribe(({ data }) => this._deleteFolder(data.id));

		fc
			.pipe(filter((e) => _CONVERSATION_UPDATED_EV_REG.test(e.event)))
			.subscribe(({ data }) => this._updateConversation(data.id));
		fc
			.pipe(filter((e) => _MESSAGE_UPDATED_EV_REG.test(e.event)))
			.subscribe(({ data }) => console.log('Message updated:', data));

		this._menuFoldersSub = this.folders.subscribe(
			(folders: {[id: string]: IMailFolderSchmV1}): void => {
				this.menuFolders.next(
					reduce<IMailFolderSchmV1, Array<IMainSubMenuItemData>>(
						loFilter(folders, (folder: IMailFolderSchmV1): boolean => folder.parent === '1'),
						(acc: Array<IMainSubMenuItemData>, folder: IMailFolderSchmV1) => {
							acc.push(
								{
									icon: 'EmailOutline',
									id: folder.id,
									label: folder.name,
									to: `/mails/folder${folder.path}`,
									children: subfolders(folders, folder.id)
								}
							);
							return acc;
						},
						[]
					)
				);
			}
		);

		combineLatest([
			syncOperations as BehaviorSubject<Array<ISyncOperation<MailFolderOp, ISyncOpRequest<unknown>>>>,
			this._folders
		]).subscribe(this._mergeFoldersAndOperations);
	}

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

	private _loadAllMailFolders(): void {
		this._idbSrvc.getAllFolders()
			.then((folders) => this._folders.next(folders));
	}

	private _updateFolder(id: string): void {
		this._idbSrvc.getFolder(id)
			.then((f) => {
				if (f) this._folders.next({ ...this._folders.getValue(), [id]: f });
			});
	}

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

	private _deleteFolder(id: string): void {
		const newVal = { ...this._folders.getValue() };
		try {
			delete newVal[id];
		}
		catch (e) {}
		this._folders.next(newVal);
	}

	private _mergeFoldersAndOperations: ([
		_syncOperations,
		folders
	]: [
		Array<ISyncOperation<MailFolderOp, ISyncOpRequest<unknown>>>,
		{[id: string]: IMailFolderSchmV1}
	]) => void =
		([
			_syncOperations,
			folders
		]) => {
			this.folders.next(
				reduce(
					_syncOperations,
					(r: {[id: string]: IMailFolderSchmV1}, v, k) => {
						switch (v.opData.operation) {
							case 'create-mail-folder':
								// eslint-disable-next-line no-param-reassign
								r[v.opData.id] = {
									_revision: 0,
									synced: true,
									id: v.opData.id,
									name: v.opData.name,
									parent: v.opData.parent,
									itemsCount: 0,
									unreadCount: 0,
									size: 0,
									path: calculateAbsPath(
										v.opData.id,
										v.opData.name,
										r,
										v.opData.parent,
									)
								};
								return r;
							case 'delete-mail-folder':
								// eslint-disable-next-line no-param-reassign
								delete r[v.opData.id];
								// TODO: Remove the children
								return r;
							case 'move-mail-folder':
								// eslint-disable-next-line no-param-reassign
								r[v.opData.id] = { ...r[v.opData.id], parent: v.opData.parent };
								// TODO: Update the path and the children paths
								return r;
							case 'rename-mail-folder':
								// eslint-disable-next-line no-param-reassign
								r[v.opData.id] = { ...r[v.opData.id], name: v.opData.name };
								// TODO: Update the path and the children paths
								return r;
							default:
								return r;
						}
					},
					cloneDeep(folders)
				)
			);
		};

	public loadMoreConversationsFromFolder(folderId: string): Promise<void> {
		return Promise.all([
			this._networkSrvc.fetchConversationsInFolder(folderId),
			this._idbSrvc.getFolder(folderId)
		]).then(([conversations, folder]) => this._idbSrvc.saveFolderData({ ...folder!, synced: true })
				.then((savedFolder): [Conversation[], IMailFolderSchmV1] => [conversations, savedFolder]))
			.then(([conversations, folder]) => this._idbSrvc.saveConversations(conversations)
				.then((): [Conversation[], IMailFolderSchmV1] => [conversations, folder]))
			.then(([conversations, folder]) => this._networkSrvc.fetchConversationsMessages(conversations)
				.then((messages): [Conversation[], MailMessage[], IMailFolderSchmV1] => [conversations, messages, folder]))
			.then(([conversations, messages, folder]) => this._idbSrvc.saveMailMessages(messages)
				.then((msgs): [Conversation[], MailMessage[], IMailFolderSchmV1] => [conversations, msgs, folder]))
			.then(([conversations, messages, folder]) => {
				forEach(
					messages,
					(m) => fcSink(
						'mails:updated:message',
						{
							id: m.id
						}
					)
				);
				forEach(
					conversations,
					(c) => fcSink(
						'app:fiberchannel',
						{
							event: 'mails:updated:conversation',
							data: {
								id: c.id
							}
						}
					)
				);
			});
	}

	public getFolderConversations(path: string): BehaviorSubject<Conversation[]> {
		const id = findKey(this.folders.value, ['path', `/${path}`]);
		if (id) {
			if (!this.conversations[id]) {
				this.conversations[id] = new BehaviorSubject<Conversation[]>([]);
				this._idbSrvc.fetchConversationsFromFolder(id)
					.then((convs) => this.conversations[id].next(convs));
			}
			return this.conversations[id];
		}
		throw new Error('Unknown folder id');
	}

	public getConversation(id: string): Promise<Conversation> {
		return this._idbSrvc.getConversation(id)
			.then((conv) => {
				if (conv) return conv;
				return this._networkSrvc.fetchConversations([id])
					.then(([conv1]: Conversation[]) => {
						if (!conv1) throw new Error(`Conversation '${id}' not found`);
						return this._idbSrvc.saveConversation(conv1);
					});
			});
	}

	public getMessages(msgIds: string[]): Promise<{[id: string]: MailMessage}> {
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
									(r, v, k) => {
										r[v.id] = v;
										return r;
									},
									{}
								)])
						)
						.then(([fromIdb, fromNetwork]) => merge(
							fromIdb,
							fromNetwork
						))
			);
	}
}
