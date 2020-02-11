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
/* eslint-env serviceworker */

// import { precacheAndRoute } from 'workbox-precaching/precacheAndRoute';
// precacheAndRoute(self.__WB_MANIFEST);

import { forEach, map } from 'lodash';
import MailsIdbService from '../idb/MailsIdbService';
import MailsNetworkService from '../network/MailsNetworkService';
import { normalizeFolder } from '../idb/IdbMailsUtils';

const _sharedBC = new BroadcastChannel('com_zextras_zapp_shell_sw');
const fcSink = (event, data) => {
	_sharedBC.postMessage({
		action: 'app:fiberchannel',
		data: {
			event,
			data
		}
	});
};
const _idbSrvc = new MailsIdbService();
const _networkSrvc = new MailsNetworkService(
	_idbSrvc
);

function _walkSOAPMailsFolder(folders) {
	return Promise.all(
		map(
			folders,
			(f) => {
				const promises = [];
				if (f.folder) {
					promises.push(
						_walkSOAPMailsFolder(f.folder)
					);
				}
				if (f.view && (f.view === 'message' || f.view === 'conversation')) {
					// console.log('Processing folder', f);
					// Store the folder data
					promises.push(
						_idbSrvc.getFolder(f.id)
							.then((folder) => {
								let newF;
								if (!folder) {
									newF = {
										...normalizeFolder(f),
										synced: f.id === '2'
									};
								}
								else {
									newF = {
										...folder,
										...normalizeFolder(f),
										synced: folder.synced
									};
								}
								return _idbSrvc.saveFolderData(newF);
							})
							.then((folder) => {
								fcSink(
									'mails:updated:folder',
									{
										id: folder.id
									}
								);
								if (!folder.synced) return Promise.resolve([[], folder]);
								return Promise.all([
									_networkSrvc.fetchConversationsInFolder(folder.id),
									Promise.resolve(folder)
								]);
							})
							.then(([conversations, folder]) => _idbSrvc.saveConversations(conversations)
								.then(() => [conversations, folder]))
							.then(([conversations, folder]) => _networkSrvc.fetchConversationsMessages(conversations)
								.then((messages) => [conversations, messages, folder]))
							.then(([conversations, messages, folder]) => _idbSrvc.saveMailMessages(messages)
								.then((msgs) => [conversations, msgs, folder]))
							.then(([conversations, messages, folder]) => {
								forEach(messages, (m) => {
									fcSink(
										'mails:updated:message',
										{
											id: m.id
										}
									);
								});
								forEach(conversations, (c) =>
									fcSink(
										'mails:updated:conversation',
										{
											id: c.id
										}
									));
							})
					);
				}
				return Promise.all(promises);
			}
		)
	);
}

function _handleSOAPChanges(changes) {
	return new Promise((resolve, reject) => {
		console.log('Changes', changes);
		resolve();
		// _fetchSoapContacts(
		// 	map(
		// 		changes,
		// 		(c) => c.id
		// 	)
		// )
		// 	.then((r) => new Promise((resolve1, reject1) => {
		// 		_idbSrvc.saveContactsData(r)
		// 			.then(() => {
		// 				forEach(r, (c) => _sharedBC.postMessage({
		// 					action: 'app:fiberchannel',
		// 					data: {
		// 						event: 'mails:updated:mail',
		// 						data: {
		// 							id: c.id
		// 						}
		// 					}
		// 				}));
		// 			})
		// 			.then((_) => resolve1())
		// 			.catch((e) => reject1(e));
		// 	}))
		// 	.then((_) => resolve())
		// 	.catch((e) => reject(e));
	});
}

function _deleteMails(ids) {
	return Promise.resolve();
	// return _idbSrvc.deleteContacts(ids)
	// 	.then((ids1) => {
	// 		forEach(ids1, (id) => _sharedBC.postMessage({
	// 			action: 'app:fiberchannel',
	// 			data: {
	// 				event: 'contacts:deleted:contact',
	// 				data: {
	// 					id
	// 				}
	// 			}
	// 		}));
	// 	});
}

function _deleteFolders(ids) {
	return _idbSrvc.deleteFolders(ids)
		.then((ids1) =>
			forEach(ids1, (id) =>
				fcSink(
					'contacts:deleted:folder',
					{
						id
					}
				)));
}

function _processSOAPNotifications(syncResponse) {
	const promises = [];
	// First sync will have the folders
	if (syncResponse.folder) {
		promises.push(
			_walkSOAPMailsFolder(syncResponse.folder)
		);
	}
	// Other syncs will have the 'cn' field populated.
	// if (syncResponse.cn) {
	// 	promises.push(
	// 		_handleSOAPChanges(syncResponse.cn)
	// 	);
	// }
	// Handle the deleted items
	if (syncResponse.deleted && syncResponse.deleted[0].cn) {
		// promises.push(
		// 	_deleteMails(syncResponse.deleted[0].cn[0].ids.split(','))
		// );
	}
	// Handle the deleted folders
	if (syncResponse.deleted && syncResponse.deleted[0].folder) {
		promises.push(
			_deleteFolders(syncResponse.deleted[0].folder[0].ids.split(','))
		);
	}
	return Promise.all(promises);
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

function _processOperationCompleted(data) {
	// console.log(data.action, data.data);
	return new Promise(((resolve, reject) => {
		const promises = [];
		if (data.action === 'sync:operation:completed') {
			// Fetch the updated information for edited objects
			const operation = data.data.data.operation;
			const result = data.data.data.result;
			switch (data.data.data.operation.opData.operation) {
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
							normalizeFolder(result.Body.CreateFolderResponse.folder[0])
						)
							.then(() => fcSink(
								'mails:updated:folder', {
									id: result.Body.CreateFolderResponse.folder[0].id
								}
							))
					);
					break;
				case 'delete-mail-folder':
					promises.push(_deleteFolders([data.data.data.operation.opData.id]));
					break;
				case 'move-mail-folder':
					promises.push(
						_idbSrvc.moveFolder(
							data.data.data.operation.opData.id,
							data.data.data.operation.opData.parent
						)
							.then(() => fcSink(
								'mails:updated:folder',
								{
									id: data.data.data.operation.opData.id
								}
							))
					);
					break;
				case 'rename-mail-folder':
					promises.push(
						_idbSrvc.renameFolder(
							data.data.data.operation.opData.id,
							data.data.data.operation.opData.name
						)
							.then(() => fcSink(
								'mails:updated:folder',
								{
									id: data.data.data.operation.opData.id
								}
							))
					);
					break;
				default:
			}
		}
		// Proxy te information to the shell to update the Operation queue.
		Promise.all(promises).then(() => {
			_sharedBC.postMessage({
				action: 'app:fiberchannel',
				data: {
					to: 'com_zextras_zapp_shell',
					event: data.action,
					data: data.data
				}
			});
			resolve();
		});
	}));
}

_sharedBC.addEventListener('message', (e) => {
	if (!e.data || !e.data.action) return;
	switch (e.data.action) {
		case 'SOAP:notification:handle':
			_processSOAPNotifications(e.data.data)
				.catch((e1) => console.error(e1));
			break;
		case 'sync:operation:completed':
		case 'sync:operation:error':
			_processOperationCompleted(e.data)
				.catch((e1) => console.error(e1));
			break;
		default:
	}
});

console.log(`Hello from mails-sw.js`);
