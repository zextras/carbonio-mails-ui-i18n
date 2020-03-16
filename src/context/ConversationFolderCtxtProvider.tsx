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

import React, {
	PropsWithChildren,
	ReactElement,
	useEffect,
	useState
} from 'react';
import {
	reduce,
	forEach,
	filter as loFilter,
	includes,
	cloneDeep
} from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { syncOperations } from '@zextras/zapp-shell/sync';
import { fc } from '@zextras/zapp-shell/fc';
import { IMailsService } from '../IMailsService';
import ConversationFolderCtxt, { ConversationWithMessages } from './ConversationFolderCtxt';
import { processOperationsConversation, processOperationsList } from './ConversationUtility';
import {
	_CONVERSATION_UPDATED_EV_REG,
	_MESSAGE_UPDATED_EV_REG,
	_CONVERSATION_DELETED_EV_REG,
	_MESSAGE_DELETED_EV_REG
} from '../MailsService';
import { MailMessage } from '../idb/IMailsIdb';

type ConversationFolderCtxtProviderProps = {
	folderPath: string;
	mailsSrvc: IMailsService;
};

const ConversationFolderCtxtProvider:
	(props: PropsWithChildren<ConversationFolderCtxtProviderProps>) => ReactElement =	({ folderPath, mailsSrvc, children }) => {

		const [convData, setConvData] = useState<
			{
				list: string[];
				map: { [id: string]: BehaviorSubject<ConversationWithMessages> };
			}
		>({ list: [], map: {} });
		const [folderId, setFolderId] = useState<string>('');

		const mapCleanUp = (
			currentList: Array<string>,
			newList: Array<string>,
			conversations: { [id: string]: ConversationWithMessages }
		): Promise<[{ [id: string]: BehaviorSubject<ConversationWithMessages> }, { [id: string]: ConversationWithMessages }]> => {
			const addedConvs = loFilter(newList, (convId) => !includes(currentList, convId));
			const removedConvs = loFilter(currentList, (convId) => !includes(newList, convId));
			const cache = cloneDeep(conversations);
			const convMap = { ...convData.map };
			const promises: Array<Promise<void>> = [];
			forEach(addedConvs, (convId) => {
				promises.push(
					(mailsSrvc.getConversation(convId, true) as Promise<ConversationWithMessages>)
						.then((conv) => {
							convMap[convId] = new BehaviorSubject(conv);
							cache[convId] = conv;
						})
				);
			});

			forEach(removedConvs, (convId) => {
				delete convMap[convId];
				delete cache[convId];
			});

			return Promise.all(promises)
				.then(() => [convMap, cache]);
		};

		useEffect(() => {
			mailsSrvc.getFolderByPath(folderPath)
				.then((folder) => {
					setFolderId(folder.id);
				});
		}, [folderPath]);

		useEffect(() => {
			let semaphore = true;
			(mailsSrvc.getFolderConversations(folderPath, true, false) as Promise<[string[], { [id: string]: ConversationWithMessages }]>)
				.then(([ids, cache]) => {
					if (!semaphore) return;
					const [modifiedIds] = processOperationsList(syncOperations.getValue(), ids, folderPath);
					mapCleanUp(ids, modifiedIds, cache)
						.then(([newConvMap, newCache]) => {
							if (!semaphore) return;
							setConvData({
								list: modifiedIds,
								map: reduce<{ [id: string]: ConversationWithMessages }, { [id: string]: BehaviorSubject<ConversationWithMessages> }>(
									newCache,
									(r: { [id: string]: BehaviorSubject<ConversationWithMessages> }, v: ConversationWithMessages, k: string) => ({
										...r,
										[k]: new BehaviorSubject(processOperationsConversation(syncOperations.getValue(), v)[0])
									}),
									{}
								)
							});
						});
				});

			return () => {
				semaphore = false;
			};
		}, [folderPath]);

		useEffect(() => {
			let semaphore = true;
			const operationSubscription = syncOperations.subscribe((operations) => {
				const [modifiedIds, isListModified] = processOperationsList(
					syncOperations.getValue(),
					convData.list,
					folderPath
				);
				if (modifiedIds.length) {
					mapCleanUp(convData.list, modifiedIds, {})
						.then(([newConvMap]) => {
							if (!semaphore) return;
							if (isListModified) {
								setConvData({
									map: newConvMap,
									list: modifiedIds
								});
							}
							forEach(
								newConvMap,
								(v) => {
									const [convModified, modified] = processOperationsConversation(
										operations,
										v.getValue()
									);
									if (modified) {
										v.next(convModified);
									}
								}
							);
						});
				}
			});
			return () => {
				semaphore = false;
				operationSubscription.unsubscribe();
			};
		}, [convData.list]);

		useEffect(() => {
			let semaphore = true;

			const messageIds: Array<{[id: string]: string[]}> = [];
			forEach(convData.map, (convBS, convId) => {
				messageIds.push({ [convId]: convBS.getValue().messages.map((message) => message.id) });
			});

			const conversationUpdatedSubscription = fc
				.pipe(filter((e) => _CONVERSATION_UPDATED_EV_REG.test(e.event)))
				.subscribe(({ data }) => {
					if (includes(convData.list, data.id)) {
						if (includes(data.parent, folderId)) {
							(mailsSrvc.getConversation(data.id, true) as Promise<ConversationWithMessages>)
								.then((conv) => {
									if (semaphore) {
										convData.map[data.id].next(conv);
									}
								});
						}
						else {
							const newConvMap = { ...convData.map };
							delete newConvMap[data.id];
							setConvData({
								list: loFilter(convData.list, (convId) => convId !== data.id),
								map: newConvMap
							});
						}
					}
					else if (includes(data.parent, folderId)) {
						(mailsSrvc.getConversation(data.id, true) as Promise<ConversationWithMessages>)
							.then((conv) => {
								if (semaphore) {
									setConvData({
										list: [data.id, ...convData.list],
										map: { ...convData.map, [data.id]: new BehaviorSubject(conv) }
									});
								}
							});
					}
				});
			const messageUpdatedSubscription = fc
				.pipe(filter((e) => _MESSAGE_UPDATED_EV_REG.test(e.event)))
				.subscribe(({ data }) => {
					const messagesInList = loFilter(
						messageIds,
						(v) => includes(Object.values(v), data.id.toString())
					);
					if (messagesInList.length > 0) {
						forEach(messagesInList, (messageObj) => {
							const convId = Object.keys(messageObj)[0];
							(mailsSrvc.getConversation(convId, true) as Promise<ConversationWithMessages>)
								.then((conv) => {
									if (semaphore) {
										convData.map[convId].next(conv);
									}
								});
						});
					}
				});
			const conversationDeletedSubscription = fc
				.pipe(filter((e) => _CONVERSATION_DELETED_EV_REG.test(e.event)))
				.subscribe(({ data }) => {
					if (includes(convData.list, data.id)) {
						const newConvMap = { ...convData.map };
						delete newConvMap[data.id];
						setConvData({
							list: loFilter(convData.list, (convId) => convId !== data.id),
							map: newConvMap
						});
					}
				});

			return () => {
				semaphore = false;
				conversationUpdatedSubscription.unsubscribe();
				messageUpdatedSubscription.unsubscribe();
				conversationDeletedSubscription.unsubscribe();
			};
		}, [folderPath, convData.list]);

		return (
			<ConversationFolderCtxt.Provider
				value={{
					convList: convData.list,
					convMap: convData.map
				}}
			>
				{ children }
			</ConversationFolderCtxt.Provider>
		);
	};

export default ConversationFolderCtxtProvider;
