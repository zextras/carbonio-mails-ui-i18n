/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2019 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import React, {
	useState,
	useEffect,
	useContext
} from 'react';
import { sendSOAPRequest } from '@zextras/zapp-shell/network';
import { sessionSrvc } from '@zextras/zapp-shell/service';
import {
	map,
	find,
	get,
	filter,
	reduce
} from 'lodash';
import { useHistory } from 'react-router';
import ComposerContext from './ComposerContext';
import MailServicesContext from '../context/MailServicesContext';

function useObservable(observable) {
	const [value, setValue] = useState(observable.value);
	useEffect(() => {
		const sub = observable.subscribe(setValue);
		return () => sub.unsubscribe();
	}, [observable]);
	return value;
}

const ComposerContextProvider = ({ children, convId }) => {
	const { syncSrvc } = useContext(MailServicesContext);
	const [contextValues, setContextValues] = useState(
		{
			to: '',
			cc: '',
			subject: '',
			message: ''
		}
	);
	const [id, setId] = useState();
	const history = useHistory();

	const userData = useObservable(
		sessionSrvc.session
	);


	useEffect(() => {
		let draftSub;
		if (syncSrvc && convId) {
			draftSub = syncSrvc.getConversationMessages(convId).subscribe((messages) => {
				const draft = find(messages, (m) => m.folder === '6');
				if (draft) {
					const toContact = find(
						draft.contacts,
						(c) => c.type === 'to'
					);
					const ccLine = reduce(
						filter(draft.contacts, (contact) => contact.type === 'cc'),
						(line, contact) => `${line} ${contact.name || contact.address},`, ''
					);
					setContextValues({
						to: (toContact && toContact.address) || '',
						cc: ccLine || '',
						subject: draft.subject || '',
						message: get(draft, draft.bodyPath).content || ''
					});
					setId(draft.id);
				}
			});
		}
		return () => {
			if (draftSub) {
				draftSub.unsubscribe();
			}
		};
	}, [convId]);

	const setField = (field, text) => {
		const newValues = { ...contextValues };
		switch (field) {
			case 'to':
				newValues.to = text;
				break;
			case 'cc':
				newValues.cc = text;
				break;
			case 'subject':
				newValues.subject = text;
				break;
			case 'message':
				newValues.message = text;
				break;
			default:
				break;
		}
		setContextValues(newValues);
	};

	const save = () => {
		const resp = sendSOAPRequest('SaveDraft', {
			m: {
				id,
				su: contextValues.subject,
				e: [
					{
						t: 'f',
						a: userData.username
					},
					{
						t: 't',
						a: contextValues.to
					},
					...(map(
						contextValues.cc.split(' '),
						(str) => ({
							a: str,
							t: 'c'
						})
					))
				],
				mp: [
					{
						ct: 'text/plain',
						content: {
							_content: contextValues.message,
						}
					}
				]
			},
		}, 'urn:zimbraMail').then((r) => setId(r.m[0].id));
	};

	const send = () => {
		sendSOAPRequest('SendMsg', {
			m: {
				did: id,
				su: contextValues.subject,
				e: [
					{
						t: 'f',
						a: userData.username
					},
					{
						t: 't',
						a: contextValues.to
					},
					...map(
						{ ...contextValues.cc.split(' ') },
						(str) => ({
							a: str,
							t: 'c'
						})
					)
				],
				mp: [
					{
						ct: 'text/plain',
						content: {
							_content: contextValues.message,
						}
					}
				]
			},
		}, 'urn:zimbraMail').then(() => {
			history.push('/mail/folder/Sent');
		//	syncSrvc.deleteConversation
		});
	};
	return (
		<ComposerContext.Provider
			value={{
				...contextValues,
				setField,
				save,
				send,
			}}
		>
			{children}
		</ComposerContext.Provider>
	);
};
export default ComposerContextProvider;
