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
import { BehaviorSubject } from 'rxjs';
import { reduce, forEach } from 'lodash';
import ConversationFolderCtxt, { ConversationWithMessages } from './ConversationFolderCtxt';
import { IMailsService } from '../IMailsService';
import { syncOperations } from '@zextras/zapp-shell/sync';
import { processOperations } from './ConversationPreviewCtxtProvider';

type ConversationFolderCtxtProviderProps = {
	folderPath: string;
	mailsSrvc: IMailsService;
};

const ConversationFolderCtxtProvider:
	(props: PropsWithChildren<ConversationFolderCtxtProviderProps>) => ReactElement =	({ folderPath, mailsSrvc, children }) => {
		const [ convData, setConvData ] = useState<
			{
				list: string[];
				map: { [id: string]: BehaviorSubject<ConversationWithMessages> };
			}
		>({ list: [], map: {} });
		useEffect(() => {
			let semaphore = true;
			(mailsSrvc.getFolderConversations(folderPath, true, false) as Promise<[string[], { [id: string]: ConversationWithMessages }]>)
				.then(([ids, cache]) => {
					if (!semaphore) return;
					setConvData(
						{
							list: ids,
							map: reduce<{ [id: string]: ConversationWithMessages }, { [id: string]: BehaviorSubject<ConversationWithMessages> }>(
								cache,
								(r: { [id: string]: BehaviorSubject<ConversationWithMessages> }, v: ConversationWithMessages, k: string) => ({
									...r,
									[k]: new BehaviorSubject(processOperations(syncOperations.getValue(), v)[0])
								}),
								{}
							)
						}
					);
				});

			const operationSubscription = syncOperations.subscribe((operations) => {
				forEach(
					convData.map,
					(v) => {
						const [convModified, modified] = processOperations(operations, v.getValue());
						if (modified) {
							v.next(convModified);
						}
					}
				);
			});

			return () => {
				semaphore = false;
				operationSubscription.unsubscribe();
			};
		}, [folderPath]);

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
