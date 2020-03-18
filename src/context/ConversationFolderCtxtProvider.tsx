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
import { syncOperations } from '@zextras/zapp-shell/sync';
import { IMailsService } from '../IMailsService';
import ConversationFolderCtxt, { ConversationWithMessages, MailMessageWithFolder } from './ConversationFolderCtxt';
import { processOperationsConversation, processOperationsList } from './ConversationUtility';

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
