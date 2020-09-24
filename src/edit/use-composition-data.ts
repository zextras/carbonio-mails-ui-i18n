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

import {
	useCallback,
	useEffect,
	useReducer, useState
} from 'react';
import {
	map,
	filter,
	throttle,
	find
} from 'lodash';
import { hooks } from '@zextras/zapp-shell';
import { MailMessagePart, MailMessageFromDb } from '../db/mail-message';
import { Participant } from '../db/mail-db-types';
import { useMessage } from '../hooks';

export type ResetAction = {
	type: 'RESET';
	payload: {
		state: CompositionState;
	};
};

export type UpdateSubjectAction = {
	type: 'UPDATE_SUBJECT';
	payload: {
		value: string;
	};
};

export type UpdateContactsAction = {
	type: 'UPDATE_CONTACTS';
	payload: {
		type: 'to' |	'cc' | 'bcc';
		value: Array<{ value: string }>;
	};
};

export type UpdateBodyAction = {
	type: 'UPDATE_BODY';
	payload: {
		html: string;
		text: string;
	};
};

export type ToggleRichTextAction = {
	type: 'TOGGLE_RICH_TEXT';
	payload: {
		richText: boolean;
	};
};
export type ToggleFlaggedAction = {
	type: 'TOGGLE_FLAGGED';
	payload: {
		flagged: boolean;
	};
};
export type ToggleUrgentAction = {
	type: 'TOGGLE_URGENT';
	payload: {
		urgent: boolean;
	};
};

export type CompositionAction = UpdateSubjectAction
	| UpdateContactsAction
	| UpdateBodyAction
	| ResetAction
	| ToggleRichTextAction
	| ToggleFlaggedAction
	| ToggleUrgentAction;

export type CompositionState = {
	to: Array<{ value: string}>;
	cc: Array<{ value: string}>;
	bcc: Array<{ value: string}>;
	subject: string;
	body: {
		text: string;
		html: string;
	};
	richText: boolean;
	flagged: boolean;
	urgent: boolean;
};

export type CompositionData = {
	compositionData: CompositionState;
	actions: {
		updateSubject: (value: string) => void;
		updateContacts: (type: 'to' |	'cc' | 'bcc', value: Array<{ value: string }>) => void;
		updateBody: (value: [string, string]) => void;
		toggleRichText: (richText: boolean) => void;
		toggleFlagged: (flagged: boolean) => void;
		toggleUrgent: (urgent: boolean) => void;
		sendMail: () => void;
	};
}

export const reducer = (state: CompositionState, action: CompositionAction): CompositionState => {
	switch (action.type) {
		case 'RESET': {
			return {
				...state,
				...action.payload.state
			};
		}
		case 'UPDATE_SUBJECT': {
			return {
				...state,
				subject: action.payload.value
			};
		}
		case 'UPDATE_CONTACTS': {
			return {
				...state,
				[action.payload.type]: action.payload.value
			};
		}
		case 'UPDATE_BODY': {
			return {
				...state,
				body: {
					html: state.richText
						? action.payload.html
						: `<p>${state.body.text}<p>`,
					text: action.payload.text
				}
			};
		}
		case 'TOGGLE_RICH_TEXT': {
			return {
				...state,
				richText: !action.payload.richText,
			};
		}
		case 'TOGGLE_FLAGGED': {
			return {
				...state,
				flagged: action.payload.flagged
			};
		}
		case 'TOGGLE_URGENT': {
			return {
				...state,
				urgent: action.payload.urgent
			};
		}
		default:
			console.warn('unrecognized action type');
			return state;
	}
};

export const stateContactsFromDraft = (draft: MailMessageFromDb, type: string): Array<{ value: string }> => map(
	filter(draft ? draft.contacts : [], (c) => c.type === type),
	(c: Participant) => ({ value: c.address })
);

export const extractBody = (draft: MailMessageFromDb): { text: string; html: string } => {
	const text = find(draft.parts, ['contentType', 'text/plain']);
	const html = find(draft.parts, ['contentType', 'multipart/alternative']);
	const htmlText = html ? find(html.parts, ['contentType', 'text/html']) : '';
	return {
		text: (text && text.content) ? text.content : '',
		html: (htmlText && htmlText.content) ? htmlText.content : ''
	};
};

export const draftToCompositionData = (draft: MailMessageFromDb): CompositionState => ({
	subject: draft ? draft.subject : '',
	to: stateContactsFromDraft(draft, 't'),
	cc: stateContactsFromDraft(draft, 'c'),
	bcc: stateContactsFromDraft(draft, 'b'),
	body: { ...extractBody(draft) },
	richText: draft
		? !!find(
			draft.parts,
			(part: MailMessagePart): boolean => part.contentType === 'multipart/alternative'
		)
		: true,
	flagged: draft ? draft.flagged : false,
	urgent: draft ? draft.urgent : false
});

export const emptyDraft: CompositionState = {
	richText: true,
	subject: '',
	urgent: false,
	flagged: false,
	to: [],
	cc: [],
	bcc: [],
	body: {
		text: '',
		html: ''
	}
};

const useCompositionData = (draftId: string, panel: boolean, folderId: string): CompositionData => {
	const { db } = hooks.useAppContext();
	const replaceHistory = hooks.useReplaceHistoryCallback();
	const [initialized, setInitialized] = useState(false);

	const [draft, loaded] = useMessage(draftId);
	const [compositionData, dispatch] = useReducer(
		reducer,
		(draft && loaded) ? draftToCompositionData(draft) : emptyDraft
	);
	const timedSaveDraft = useCallback(
		throttle(
			(dId: string, cData: CompositionState): void => db.saveDraft(dId, cData)
				.then((newId: string): void => {
					if (newId !== dId) {
						replaceHistory(panel
							? `/folder/${folderId}?edit=${newId}`
							: `/edit/${newId}`);
					}
				}),
			500,
			{ leading: false, trailing: true }
		),
		[replaceHistory]
	);
	useEffect(
		() => {
			if (loaded && draft && !initialized) {
				dispatch({ type: 'RESET', payload: { state: draftToCompositionData(draft) } });
				setInitialized(true);
			}
		},
		[draft, initialized, loaded]
	);
	useEffect(
		() => {
			timedSaveDraft.cancel();
			timedSaveDraft(draftId, compositionData);
		}, [compositionData, draftId, folderId, panel, replaceHistory, timedSaveDraft]
	);
	const updateSubject = useCallback(
		(value: string): void => {
			dispatch({ type: 'UPDATE_SUBJECT', payload: { value } });
		},
		[]
	);
	const updateBody = useCallback(
		(value: [string, string]): void => {
			dispatch({ type: 'UPDATE_BODY', payload: { text: value[0], html: value[1] } });
		},
		[]
	);
	const updateContacts = useCallback(
		(type: 'to' | 'cc' | 'bcc', value: Array<{ value: string }>): void => {
			dispatch({ type: 'UPDATE_CONTACTS', payload: { value, type } });
		},
		[]
	);
	const toggleRichText = useCallback(
		(richText: boolean): void => {
			dispatch({ type: 'TOGGLE_RICH_TEXT', payload: { richText } });
		},
		[]
	);
	const toggleUrgent = useCallback(
		(urgent: boolean): void => {
			dispatch({ type: 'TOGGLE_URGENT', payload: { urgent } });
		},
		[]
	);
	const toggleFlagged = useCallback(
		(flagged: boolean): void => {
			dispatch({ type: 'TOGGLE_FLAGGED', payload: { flagged } });
		},
		[]
	);
	const sendMail = useCallback(
		() => {
			db.sendMail(draftId).then((dId: string) => {
				if (panel) {
					replaceHistory(`/folder/${folderId}/`);
				}
			});
		},
		[db, draftId, folderId, panel, replaceHistory]
	);
	return {
		compositionData,
		actions: {
			updateSubject,
			updateContacts,
			updateBody,
			toggleRichText,
			toggleUrgent,
			toggleFlagged,
			sendMail
		}
	};
};

export default useCompositionData;
