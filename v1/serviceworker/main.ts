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

import { forEach, map, xor } from 'lodash';
import { fc, fcSink } from '@zextras/zapp-shell/fc';
import { filter } from 'rxjs/operators';

import MailsNetworkService from '../network/MailsNetworkService';
import { normalizeFolder } from '../idb/IdbMailsUtils';
import MailsIdbService from '../idb/MailsIdbService';
import { ISoapSyncMailFolderObj, ISoapSyncMailResponse } from '../../src/ISoap';
import { IMailFolderSchmV1, MailMessage } from '../idb/IMailsIdb';
import MailsService from '../../src/MailsService';

const _idbSrvc = new MailsIdbService();
const _networkSrvc = new MailsNetworkService(
	_idbSrvc
);

const _mailsSrvc = new MailsService(
	_idbSrvc,
	_networkSrvc
);

function _walkSOAPMailsFolder(folders: ISoapSyncMailFolderObj[]): Promise<void> {
	return Promise.all(
		map(
			folders,
			(f) => {
				const promises: Array<Promise<void>> = [];
				if (f.folder) {
					promises.push(
						_walkSOAPMailsFolder(f.folder)
					);
				}
				if (f.view && (f.view === 'message' || f.view === 'conversation')) {
					// console.log('Processing folder', f);
					// Store the folder data
					promises.push(
						_mailsSrvc.getFolderById(f.id)
							.then((folder: IMailFolderSchmV1) => {
								if (folder.id === '2') {
									return _mailsSrvc.getFolderConversations(folder.path, true).then();
								}
								return undefined;
							})
					);
				}
				return Promise.all(promises).then();
			}
		)
	).then();
}

function _handleSOAPChanges(syncResponse: ISoapSyncMailResponse): Promise<void> {
	const promises: Array<Promise<void>> = [];

	if (syncResponse.c) {
		promises.push(
			new Promise((resolve, reject): Promise<void> => _networkSrvc.fetchConversations(
				map(
					syncResponse.c,
					(c) => c.id
				)
			)
				.then((r) => _idbSrvc.saveConversations(r))
				.then((_) => resolve())
				.catch((e) => reject(e)))
		);
	}

	if (syncResponse.m) {
		promises.push(
			new Promise((resolve, reject): void => {
				_networkSrvc.fetchConversations(
					map(syncResponse.m, (m) => m.cid)
				)
					.then((conversations) => _idbSrvc.saveConversations(conversations))
					.then((_) => resolve())
					.catch((e) => reject(e));
			})
		);
		promises.push(
			new Promise((resolve, reject) => {
				_networkSrvc.fetchMailMessages(
					map(syncResponse.m, (m) => m.id)
				)
					.then((mailMessages) => _idbSrvc.saveMailMessages(mailMessages))
					.then((_) => resolve())
					.catch((e) => reject(e));
			})
		);
	}

	return Promise.all(promises).then();
}

function _deleteConversations(ids: string[]) {
	return _idbSrvc.deleteConversations(ids);
}

function _deleteMessages(ids: string[], conversationsDeleted: string[]) {
	return _idbSrvc.getMessages(ids)
		.then((messages: {[p: string]: MailMessage}): Promise<void> => {
			const promises: Array<Promise<void>> = [];
			const conversationsToUpdate = xor(
				conversationsDeleted,
				map(messages, (message) => message.conversation)
			);
			forEach(conversationsToUpdate, (convId) => {
				promises.push(
					new Promise(
						(resolve, reject): Promise<void> => _networkSrvc.fetchConversations([convId])
							.then((r) => _idbSrvc.saveConversations(r))
							.then((_) => resolve())
							.catch((e) => {
								if (e.message.includes('no such message')) {
									resolve(_idbSrvc.deleteConversations([convId]).then());
								}
							})
					)
				);
			});
			promises.push(_idbSrvc.deleteMessages(ids).then());
			return Promise.all(promises).then();
		});
}

function _deleteFolders(ids: string[]): Promise<void> {
	return _idbSrvc.deleteFolders(ids)
		.then((ids1) =>
			forEach(ids1, (id) =>
				fcSink(
					'contacts:deleted:folder',
					{
						id
					}
				)))
		.then();
}

function _processSOAPNotifications(syncResponse: ISoapSyncMailResponse): Promise<void> {
	const promises: Array<Promise<void>> = [];
	// First sync will have the folders
	if (syncResponse.folder) {
		promises.push(
			_walkSOAPMailsFolder(syncResponse.folder)
		);
	}
	if (syncResponse) {
		promises.push(
			_handleSOAPChanges(syncResponse)
		);
	}
	// Handle the deleted items
	const conversationsToDelete = [];
	if (syncResponse.deleted && syncResponse.deleted[0].c) {
		conversationsToDelete.push(...syncResponse.deleted[0].c[0].ids.split(','));
		promises.push(
			_deleteConversations(conversationsToDelete).then()
		);
	}
	if (syncResponse.deleted && syncResponse.deleted[0].m) {
		promises.push(
			_deleteMessages(syncResponse.deleted[0].m[0].ids.split(','), conversationsToDelete)
		);
	}
	// Handle the deleted folders
	if (syncResponse.deleted && syncResponse.deleted[0].folder) {
		promises.push(
			_deleteFolders(syncResponse.deleted[0].folder[0].ids.split(','))
		);
	}
	return Promise.all(promises).then();
}

// function _processContactCreated(operation, response) {
// 	return _fetchSoapContacts([response.CreateContactResponse.cn[0].id])
// 		.then((r) => new Promise((resolve, reject) => {
// 			_idbSrvc.saveContactsData(r)
// 				.then(() => {
// 					forEach(r, (c) => _sharedBC.postMessage({
// 						action: 'app:fiberchannel',
// 						data: {
// 							event: 'mails:updated:mail',
// 							data: {
// 								id: c.id
// 							}
// 						}
// 					}));
// 				})
// 				.then((_) => resolve())
// 				.catch((e) => reject(e));
// 		}));
// }

// function _processContactDeleted(operation, response) {
// 	return _deleteContacts([response.ContactActionResponse.action.id]);
// }

// function _processContactModified(operation, response) {
// 	return _fetchSoapContacts([response.ModifyContactResponse.cn[0].id])
// 		.then((r) => new Promise((resolve, reject) => {
// 			_idbSrvc.saveContactsData(r)
// 				.then(() => {
// 					forEach(r, (c) => _sharedBC.postMessage({
// 						action: 'app:fiberchannel',
// 						data: {
// 							event: 'mails:updated:mail',
// 							data: {
// 								id: c.id
// 							}
// 						}
// 					}));
// 				})
// 				.then((_) => resolve())
// 				.catch((e) => reject(e));
// 		}));
// }

// function _processContactMoved(operation, response) {
// 	return _fetchSoapContacts([response.ContactActionResponse.action.id])
// 		.then((r) => new Promise((resolve, reject) => {
// 			_idbSrvc.saveContactsData(r)
// 				.then(() => {
// 					forEach(r, (c) => _sharedBC.postMessage({
// 						action: 'app:fiberchannel',
// 						data: {
// 							event: 'mails:updated:mail',
// 							data: {
// 								id: c.id
// 							}
// 						}
// 					}));
// 				})
// 				.then((_) => resolve())
// 				.catch((e) => reject(e));
// 		}));
// }

function _processOperationCompleted(data: any): Promise<void> {
	// console.log(data.action, data.data);
	const promises: Array<Promise<void>> = [];
	if (data.action === 'sync:operation:completed') {
		// Fetch the updated information for edited objects
		const { operation, result } = data.data.data;
		switch (operation.opData.operation) {
			// case 'create-contact':
			// 	promises.push(_processContactCreated(operation, result.Body));
			// 	break;
			// case 'delete-contact':
			// 	promises.push(_processContactDeleted(operation, result.Body));
			// 	break;
			// case 'modify-contact':
			// 	promises.push(_processContactModified(operation, result.Body));
			// 	break;
			// case 'move-contact':
			// 	promises.push(_processContactMoved(operation, result.Body));
			// 	break;
			case 'create-mail-folder':
				promises.push(
					_idbSrvc.saveFolderData(
						normalizeFolder(
							result.Body.CreateFolderResponse.folder[0],
							true,
						)
					).then()
				);
				break;
			case 'delete-mail-folder':
				promises.push(_deleteFolders([operation.opData.id]).then());
				break;
			case 'move-mail-folder':
				promises.push(
					_idbSrvc.moveFolder(
						operation.opData.id,
						operation.opData.parent
					)
						.then()
				);
				break;
			case 'rename-mail-folder':
				promises.push(
					_idbSrvc.renameFolder(
						operation.opData.id,
						operation.opData.name
					)
						.then()
				);
				break;
			default:
		}
	}
	// Proxy te information to the shell to update the Operation queue.
	return Promise.all(promises).then();
}

fc.pipe(filter(({ event }) => event === 'SOAP:notification:handle'))
	.subscribe((e) => _processSOAPNotifications(e.data).then().catch((e1) => console.error(e1)));
fc.pipe(filter(({ event }) => event === 'sync:operation:completed' || event === 'sync:operation:error'))
	.subscribe((e) => _processOperationCompleted(e.data).then().catch((e1) => console.error(e1)));
