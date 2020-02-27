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

import mailContext from './MailContext';
import React, { useState, useEffect } from 'react';
import {
	reduce,
	forEach,
	keyBy,
	sortBy
} from 'lodash';

function useObservable(observable) {
	const [value, setValue] = useState(observable.value);
	useEffect(() => {
		const sub = observable.subscribe(setValue);
		return () => sub.unsubscribe();
	}, [observable]);
	return value;
}

const MailContextProvider = ({ path, mailsSrvc, children }) => {

	const conversations = mailsSrvc.getFolderConversations(path);

	const [mails, setMails] = useState({});

	useEffect(() => {
		let cancelled = false;
		conversations.subscribe((c) => {
			const ids = reduce(
				c,
				(acc, conv) => {
					forEach(
						conv.messages,
						(mailInfo) => {
							if (!mails[mailInfo.id]) acc.push(mailInfo.id);
						}
					);
					return acc;
				},
				[]
			);
			mailsSrvc.getMessages(ids).then((newMails) => {
				if (!cancelled) {
					setMails({ ...mails, ...keyBy(newMails, 'id') });
				}
			});
		});
		return () => {
			cancelled = true;
		};
	}, [conversations]);

	return (
		<mailContext.Provider
			value={{
				conversations,
				mails
			}}
		>
			{children}
		</mailContext.Provider>
	);
};

export default MailContextProvider;
