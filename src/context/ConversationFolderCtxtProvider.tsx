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
import { reduce } from 'lodash';
import ConversationFolderCtxt, { ConversationWithMessages } from './ConversationFolderCtxt';
import { IMailsService } from '../IMailsService';

type ConversationFolderCtxtProviderProps = {
	folderPath: string;
	mailsSrvc: IMailsService;
};

const ConversationFolderCtxtProvider:
	(props: PropsWithChildren<ConversationFolderCtxtProviderProps>) => ReactElement =	({ folderPath, mailsSrvc, children }) => {
		const [convList, setConvList] = useState<string[]>([]);
		const [convMap, setConvMap] = useState<{ [id: string]: BehaviorSubject<ConversationWithMessages> }>({});

		useEffect(() => {
			let semaphore = true;
			(mailsSrvc.getFolderConversations(folderPath, true) as Promise<[string[], { [id: string]: ConversationWithMessages }]>)
				.then(([ids, cache]) => {
					if (!semaphore) return;
					setConvMap(
						reduce<{ [id: string]: ConversationWithMessages }, { [id: string]: BehaviorSubject<ConversationWithMessages> }>(
							cache,
						(r: { [id: string]: BehaviorSubject<ConversationWithMessages> }, v: ConversationWithMessages, k: string) => ({
								...r,
								[k]: new BehaviorSubject(v)
							}),
							{}
						)
					);
					setConvList(ids);
				});

			return () => {
				semaphore = false;
			};
		}, [folderPath]);

		return (
			<ConversationFolderCtxt.Provider
				value={{
					convList,
					convMap
				}}
			>
				{ children }
			</ConversationFolderCtxt.Provider>
		);
	};

export default ConversationFolderCtxtProvider;
