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
import React, { useMemo, useState, useEffect } from 'react';
import { reduce, forEach, keyBy } from 'lodash';

function useObservable(observable) {
	const [value, setValue] = useState(observable.value);
	useEffect(() => {
		const sub = observable.subscribe(setValue);
		return () => sub.unsubscribe();
	}, [observable]);
	return value;
}

const MailContextProvider = ({ path, mailsSrvc, children }) => {

	const conversations = useObservable(mailsSrvc.getFolderConversations(path));

	const [mails, setMails] = useState({});

	useEffect(() => {
		const ids = reduce(
				conversations,
				(acc, conv) => {
					forEach(
						conv.messages,
						mailInfo => {
							if (!mails[mailInfo.id]) acc.push(mailInfo.id);
						}
					);
					return acc;
				},
			[]
			);
		mailsSrvc.getMessages(ids).then(newMails => setMails({...mails, ...keyBy(newMails, 'id')}));
		}, [conversations]);

	const view = [];
	const edit = [];
	return (
		<mailContext.Provider
		value={{
			conversations,
			mails,
			view,
			edit,
			openView: (id) => console.log(`Open view for ${id}`),
			openEdit: (id) => console.log(`Open editor for ${id}`),
			closeView: (id) => console.log(`Close view for ${id}`),
			closeEdit: (id) => console.log(`Close editor for ${id}`)
		}}
		>
			{children}
		</mailContext.Provider>
	)
};

export default MailContextProvider;
