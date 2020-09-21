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
	useCallback,
	useEffect,
	useState
} from 'react';
import {
	map,
	reduce,
	forEach,
	filter as loFilter,
	includes,
	cloneDeep,
	zipObject,
	keys
} from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { syncOperations } from '@zextras/zapp-shell/sync';
import { fc } from '@zextras/zapp-shell/fc';
import { IMailsService } from '../../src/IMailsService';
import ConversationFolderCtxt, { ConversationWithMessages, MailMessageWithFolder } from './ConversationFolderCtxt';
import { processOperationsConversation, processOperationsList } from './ConversationUtility';
import {
	_CONVERSATION_UPDATED_EV_REG,
	_MESSAGE_UPDATED_EV_REG,
	_CONVERSATION_DELETED_EV_REG,
	_MESSAGE_DELETED_EV_REG
} from '../../src/MailsService';

type ConversationFolderCtxtProviderProps = {
	folderPath: string;
	mailsSrvc: IMailsService;
};

function mapCleanUp(
	mailsSrvc: IMailsService,
	convData: {
		list: string[];
		map: { [id: string]: BehaviorSubject<ConversationWithMessages> };
	},
	currentList: Array<string>,
	newList: Array<string>,
	conversations: { [id: string]: ConversationWithMessages }
): Promise<[
	{ [id: string]: BehaviorSubject<ConversationWithMessages> },
	{ [id: string]: ConversationWithMessages }
]> {
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
}

function ConversationFolderCtxtProvider({
	folderPath,
	mailsSrvc,
	children
}: PropsWithChildren<ConversationFolderCtxtProviderProps>): ReactElement {
	const [convData, setConvData] = useState<
		{
			list: string[];
			map: { [id: string]: BehaviorSubject<ConversationWithMessages> };
		}
	>({ list: [], map: {} });
	const [folderId, setFolderId] = useState<string>('');
	const [hasMore, setHasMore] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	function applyProcessOperationToConvs(
		newCache: {[id: string]: ConversationWithMessages},
		modifiedIds: Array<string>
	): void {
		Promise.all(
			map(
				newCache,
				(v) => processOperationsConversation(syncOperations.getValue(), v, mailsSrvc)
					.then(([conv]) => conv)
			)
		)
			.then((convArray) => {
				setConvData({
					list: modifiedIds,
					map: reduce<{ [id: string]: ConversationWithMessages }, { [id: string]: BehaviorSubject<ConversationWithMessages> }>(
						zipObject(keys(newCache), convArray),
						(r: { [id: string]: BehaviorSubject<ConversationWithMessages> }, v: ConversationWithMessages, k: string) => ({
							...r,
							[k]: new BehaviorSubject(v)
						}),
						{}
					)
				});
			});
	}

	const _loadConversations = useCallback<(more: boolean) => Promise<[string[], { [id: string]: ConversationWithMessages }]>>((more) => {
		return (mailsSrvc.getFolderConversations(folderPath, more) as Promise<[string[], { [id: string]: ConversationWithMessages }]>);
	}, [mailsSrvc, folderPath]);

	useEffect(() => {
		mailsSrvc.getFolderByPath(folderPath)
			.then((folder) => setFolderId(folder.id));
	}, [folderPath]);

	useEffect(() => {
		let semaphore = true;
		setIsLoading(true);
		mailsSrvc.getFolderByPath(folderPath)
			.then(
				(f) => _loadConversations(false)
					.then(([ids, cache]) => {
						if (f.hasMore && ids.length < 50) {
							return _loadConversations(true);
						}
						return [ids, cache];
					})
					.then(([ids, cache]) => {
						if (!semaphore) return;
						const [modifiedIds] = processOperationsList(
							syncOperations.getValue(),
							ids as string[],
							cache as {[id: string]: ConversationWithMessages},
							folderId
						);
						mapCleanUp(
							mailsSrvc,
							convData,
							ids as string[],
							modifiedIds,
							cache as {[id: string]: ConversationWithMessages}
						)
							.then(([, newCache]) => {
								if (!semaphore) return;
								applyProcessOperationToConvs(newCache, modifiedIds);
							});
					})
			)
			.then(() => {
				if (!semaphore) return;
				setIsLoading(false);
			});

		return () => {
			semaphore = false;
		};
	}, [folderPath, _loadConversations]);

	useEffect(() => {
		const s = mailsSrvc.getFolderObservableByPath(folderPath)
			.subscribe((f) => f && f.hasMore !== hasMore && setHasMore(f.hasMore));
		return () => s.unsubscribe();
	}, [folderPath, hasMore, setHasMore]);

	useEffect(() => {
		let semaphore = true;
		const cache = reduce(convData.map, (r,v,k) => ({ ...r, [k]: v.getValue() }), {});
		const operationSubscription = syncOperations.subscribe((operations) => {
			const [modifiedIds, isListModified] = processOperationsList(
				syncOperations.getValue(),
				convData.list,
				cache,
				folderId
			);
			mapCleanUp(mailsSrvc, convData, convData.list, modifiedIds, cache)
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
							processOperationsConversation(operations, v.getValue(), mailsSrvc)
								.then(([convModified, modified]) => {
									if (modified) {
										v.next(convModified);
									}
								});
						}
					);
				});
		});
		return () => {
			semaphore = false;
			operationSubscription.unsubscribe();
		};
	}, [convData.list]);

	const loadMore = useCallback(() => {
		let semaphore = true;
		setIsLoading(true);
		_loadConversations(true)
			.then(([ids, cache]) => {
				if (!semaphore) return;
				const [modifiedIds] = processOperationsList(syncOperations.getValue(), ids, cache, folderId);
				mapCleanUp(mailsSrvc, convData, ids, modifiedIds, cache)
					.then(([, newCache]) => {
						if (!semaphore) return;
						applyProcessOperationToConvs(newCache, modifiedIds);
						setIsLoading(false);
					});
			});

		return () => {
			semaphore = false;
		};
	}, [folderPath, _loadConversations]);

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
				hasMore,
				convList: convData.list,
				convMap: convData.map,
				isLoading,
				loadMore
			}}
		>
			{ children }
		</ConversationFolderCtxt.Provider>
	);
}

export default ConversationFolderCtxtProvider;
