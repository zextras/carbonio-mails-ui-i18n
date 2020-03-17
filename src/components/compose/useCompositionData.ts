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

import { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { map, reduce, startsWith, debounce } from 'lodash';
import { useHistory } from 'react-router-dom';
import { Subscription } from 'rxjs';
import { IMailsService } from '../../IMailsService';
import { MailMessage, Participant } from '../../idb/IMailsIdb';
import {
	AttachmentDispatch,
	CompositionAttachment,
	CompositionData,
	CompositionDataWithFn,
	CompositionParticipants,
	DispatchAction,
	EditorDispatch,
	InitDispatch, ModeDispatch,
	PriorityDispatch,
	UpdateDispatch
} from './IuseCompositionData';
import activityContext from '../../activity/ActivityContext';
import { mailToCompositionData } from '../../ISoap';

const emptyMail: CompositionData = {
	priority: false,
	html: false,
	to: [],
	cc: [],
	bcc: [],
	subject: '',
	body: '',
	attachments: []
};

function reducer(state: CompositionData, action: DispatchAction) {
	switch (action.type) {
		case 'switch-mode': {
			if (typeof (action as ModeDispatch).htmlMode !== 'undefined') {
				return {
					...state,
					html: action.htmlMode
				};
			}
			break;
		}
		case 'attachments-saved': {
			if ((action as AttachmentDispatch).attachments) {
				return {
					...state, attachments: action.attachments
				};
			}
			break;
		}
		case 'editor-change': {
			if ((action as EditorDispatch).body) {
				return {
					...state,
					body: action.body
				};
			}
			break;
		}
		case 'init': {
			if ((action as InitDispatch).data) {
				return {
					...emptyMail,
					...action.data
				};
			}
			break;
		}
		case 'priority': {
			if (typeof (action as PriorityDispatch).priority !== 'undefined') {
				return { ...state, priority: action.priority };
			}
			break;
		}
		case 'update': {
			if ((action as UpdateDispatch).field) {
				return {
					...state, [action.field]: action.value
				};
			}
			break;
		}
		case 'reset': return {
			...emptyMail
		};
		default: {
			console.warn('Invalid action dispatch: ', action);
			return state;
		}
	}
	console.warn('Invalid action dispatch: ', action);
	return state;
}

export default function useCompositionData(
	id: string,
	mailsSrvc: IMailsService
): CompositionDataWithFn {
	const [draftId, setDraftId] = useState<string>(id);
	const [data, dispatch] = useReducer(reducer, { ...emptyMail });
	const { set, reset } = useContext(activityContext);
	const history = useHistory();
	const debouncedSave = useCallback(
		debounce(
			mailsSrvc.saveDraft,
			5000,
			{ maxWait: 15000 }
		),
		[]
	);
	useEffect(
		() => {
			if (!(draftId === 'new' || startsWith(draftId, 'offline'))) {
				debouncedSave(data, draftId, []);// .then(console.log);
			}
		},
		[data, draftId]
	);

	useEffect(
		() => {
			let idSub: Subscription | undefined;
			if (draftId === 'new') {
				idSub = mailsSrvc.createDraft().subscribe(
					{
						next: setDraftId,
						complete: () => {
							idSub && idSub.unsubscribe();
							set('mailEdit', draftId);
							history.push('/mails/folder/Drafts');
						}
					}
				);
			}
			else if (!startsWith(draftId, 'offline')) {
				mailsSrvc.getMessages([draftId], false)
					.then(
						(result: { [id: string]: MailMessage }) => {
							if (result[draftId]) {
								dispatch(
									{
										type: 'init',
										data: mailToCompositionData(result[draftId])
									}
								);
							}
						}
					);
			}
		},
		[draftId, mailsSrvc]
	);
	const onFileLoad = useCallback((ev, files) => {
		mailsSrvc.uploadAttachments(files)
			.then((newAtts: Array<CompositionAttachment>) => mailsSrvc.saveDraft(data, draftId, newAtts))
			.then((draft: CompositionData) => dispatch(
				{
					type: 'attachments-saved',
					attachments: draft.attachments
				}
			));
	}, [data, dispatch, draftId]);
	return {
		...data,
		onFileLoad,
		onSend: () => mailsSrvc.sendDraft(data, draftId).then(() => reset('mailEdit')),
		onParticipantChange: (field: 'to' | 'cc' | 'bcc', value: CompositionParticipants): void => dispatch({ type: 'update', field, value }),
		onPriorityChange: (value: boolean): void => dispatch({ type: 'priority', priority: value }),
		onEditorChange: (body: string): void => dispatch({ type: 'editor-change', body }),
		onModeChange: (html: boolean): void => dispatch({ type: 'switch-mode', htmlMode: html }),
		onSubjectChange: (value: string): void => dispatch({ type: 'update', field: 'subject', value })
	};
}
