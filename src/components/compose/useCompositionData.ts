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

import { ChangeEvent, useCallback, useEffect, useReducer, useState } from 'react';
import { IMailsService } from '../../IMailsService';
import { map, reduce, startsWith, debounce } from 'lodash';
import { MailMessage, Participant } from '../../idb/IMailsIdb';
import {
	AddAttachmentsDispatch, CompositionAttachment,
	CompositionData,
	CompositionDataWithFn, CompositionParticipants,
	DispatchAction,
	InitDispatch,
	PriorityDispatch, UpdateDispatch
} from './IuseCompositionData';
import { Subscription } from 'rxjs';

const emptyMail: CompositionData = {
	priority: false,
	to: [],
	cc: [],
	bcc: [],
	subject: '',
	body: '',
	attachments: []
};

function reducer(state: CompositionData, action: DispatchAction) {
	switch (action.type) {
		case 'addAttachments': {
			if ((action as AddAttachmentsDispatch).attachments) {
				return {
					...state,
					attachments: [
						...state.attachments,
						...action.attachments
					]
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
			if ((action as UpdateDispatch).field
				&& (action as UpdateDispatch).value) {
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

function normalizeParticipants(type: string, participants: Array<Participant>): CompositionParticipants {
	return reduce(
		participants,
		(acc: CompositionParticipants, c: Participant) => {
			if (c.type === type) {
				return [...acc, { value: c.address }];
			}
			return acc;
		},
		[]
	);
}

export default function useCompositionData(
	id: string,
	mailsSrvc: IMailsService
): CompositionDataWithFn {
	const [draftId, setDraftId] = useState<string>(id);
	const [data, dispatch] = useReducer(reducer, { ...emptyMail });
	const [richText, setRichText] = useState(false);
	const debouncedSave = useCallback(
		debounce(
			mailsSrvc.saveDraft,
			1000,
			{ maxWait: 10000 }
		),
		[]
	);
	useEffect(
		() => {
			if (!(draftId === 'new' || startsWith(draftId, 'offline'))) {
				debouncedSave(data, draftId);
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
						}
					}
				);
			}
			else if (!startsWith(draftId, 'offline')) {
				mailsSrvc.getMessages([draftId], false)
					.then(
						(result: { [id: string]: MailMessage }) => {
							if (result[draftId]) {
								const draft = result[draftId];
								const to = normalizeParticipants('t', draft.contacts);
								const cc = normalizeParticipants('c', draft.contacts);
								const bcc = normalizeParticipants('b', draft.contacts);
								const att: Array<CompositionAttachment> = [];
								dispatch(
									{
										type: 'init',
										data: {
											attachments: att,
											priority: draft.urgent,
											to,
											cc,
											bcc,
											subject: draft.subject,
											body: '',
										}
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
		Promise.all(
			map(
				files,
				(file) => mailsSrvc.uploadAttachment(file)
					.then((aid: string): CompositionAttachment => ({ aid, file }))
			)
		)
			.then((attachments) => {
				dispatch(
					{
						type: 'addAttachments',
						attachments
					}
				);
			});
	}, [data, dispatch]);

	return {
		attachments: data.attachments,
		html: richText,
		to: data.to,
		cc: data.cc,
		bcc: data.bcc,
		subject: data.subject,
		body: data.body,
		priority: data.priority,
		onFileLoad,
		onSend: () => console.log(data),
		onParticipantChange: (field: 'to' | 'cc' | 'bcc', value: CompositionParticipants): void => dispatch({ type: 'update', field, value }),
		onModeChange: setRichText,
		onPriorityChange: (value: boolean): void => dispatch({ type: 'priority', priority: value })
	};
}
/**
 * start:
 * getDraft //DONE
 * -> yep -> set data //DONE
 * -> nop -> init data
 */
