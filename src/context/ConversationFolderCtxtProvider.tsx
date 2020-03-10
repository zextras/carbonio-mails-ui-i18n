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
	filter,
	includes,
	cloneDeep
} from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { syncOperations } from '@zextras/zapp-shell/sync';
import { IMailsService } from '../IMailsService';
import ConversationFolderCtxt, { ConversationWithMessages } from './ConversationFolderCtxt';
import { processOperationsConversation, processOperationsList } from './ConversationUtility';

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

		const mapCleanUp = (
			currentList: Array<string>,
			newList: Array<string>,
			conversations: { [id: string]: ConversationWithMessages }
		): Promise<[{ [id: string]: BehaviorSubject<ConversationWithMessages> }, { [id: string]: ConversationWithMessages }]> => {
			const addedConvs = filter(newList, (convId) => !includes(currentList, convId));
			const removedConvs = filter(currentList, (convId) => !includes(newList, convId));
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
