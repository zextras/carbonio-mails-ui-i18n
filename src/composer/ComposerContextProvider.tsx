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
	FC,
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
import { IStoredSessionData } from '@zextras/zapp-shell/lib/idb/IShellIdbSchema';
import { BehaviorSubject } from 'rxjs';

import ComposerContext from './ComposerContext';
import { IComposerInputs } from './IComposerContext';
import {
	ISaveDraftRequest,
	ISaveDraftResponse,
	IMailContact,
	ISendMailRequest
} from './IComposerSoap';
import MailServicesContext from '../context/MailServicesContext';

function useObservable<T>(observable: BehaviorSubject<T>): T {
	const [value, setValue] = useState<T>(observable.value);
	useEffect(() => {
		const sub = observable.subscribe(setValue);
		return (): void => sub.unsubscribe();
	}, [observable]);
	return value;
}

const ComposerContextProvider: FC<{ convId: string }> = ({ children, convId }) => {
	const { syncSrvc } = useContext(MailServicesContext);
	const [contextValues, setContextValues] = useState<IComposerInputs>(
		{
			to: '',
			cc: '',
			subject: '',
			message: ''
		}
	);
	const [id, setId] = useState<string>();

	const userData = useObservable<IStoredSessionData>(
		sessionSrvc.session as unknown as BehaviorSubject<IStoredSessionData>
	);

	useEffect(() => {
		const draftSub = syncSrvc.getConversationMessages(convId).subscribe((messages) => {
			const draft = find(messages, (m) => m.folder === '6');
			if (draft) {
				const toContact: IMailContactSchm | undefined = find(
					draft.contacts,
					(c: IMailContactSchm): boolean => c.type === 'to'
				);
				const ccLine: string = reduce(
					filter(draft.contacts, (contact: IMailContactSchm): boolean => contact.type === 'cc'),
					(line, contact) => `${line} ${contact.name || contact.address},`, ''
				);
				setContextValues({
					to: toContact.address || '',
					cc: ccLine || '',
					subject: draft.subject || '',
					message: get(draft, draft.bodyPath).content || ''
				});
			}
			return () => {
				draftSub.unsubscribe();
			};
		});
	}, [convId]);

	const setField = (field: 'to' | 'cc' | 'subject' | 'message', text: string): void => {
		const newValues: IComposerInputs = { ...contextValues };
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

	const save = (): void => {
		const resp = sendSOAPRequest<ISaveDraftRequest, ISaveDraftResponse>('SaveDraft', {
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
						(str: string): IMailContact => ({
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
		}, 'urn:zimbraMail').then((r: ISaveDraftResponse): void => {
			console.log(r);
			setId(r.m[0].id);
		});
	};

	const send = (): void => {
		const resp = sendSOAPRequest<ISendMailRequest, ISaveDraftResponse>('SendMsg', {
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
						(str: string): IMailContact => ({
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
		}, 'urn:zimbraMail').then();
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
