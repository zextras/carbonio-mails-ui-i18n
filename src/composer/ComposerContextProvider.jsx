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
import { sessionSrvc } from '@zextras/zapp-shell/service';
import { fcSink, fc } from '@zextras/zapp-shell/fc';
import { filter as rxFilter } from 'rxjs/operators';
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
		return (): void => sub.unsubscribe();
	}, [observable]);
	return value;
}

const ComposerContextProvider = ({ children, convId }): void => {
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

	fc.pipe(
		rxFilter(
			(ev) => (
				ev.event === 'sync:operation:completed'
				&& ev.data.operation.opData.opName
				&& ev.data.operation.opData.opName === 'saveDraft'
			)
		)
	).subscribe((ev) => {
		setId(ev.data.result.m[0].id);
		history.push(`/mail/folder/Drafts?comp=${ev.data.result.m[0].id}`);
	});

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
		return (): void => {
			if (draftSub) {
				draftSub.unsubscribe();
			}
		};
	}, [convId]);

	const setField = (field, text): void => {
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
		const tempDraftId = id || `draft-${Date.now()}`;
		setId(tempDraftId);
		fcSink('sync:operation:push', {
			opType: 'soap',
			opData: { opName: 'saveDraft', tempDraftId },
			description: `Save Draft (${contextValues.subject})`,
			request: {
				command: 'SaveDraft',
				urn: 'urn:zimbraMail',
				data: {
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
					}
				}
			}
		});
	};

	const send = () => {
		fcSink('sync:operation:push', {
			opType: 'soap',
			opData: {},
			description: `Send Mail (${contextValues.subject})`,
			request: {
				command: 'SendMsg',
				urn: 'urn:zimbraMail',
				data: {
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
				}
			}
		});
		history.push('/mail/folder/Sent');
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
