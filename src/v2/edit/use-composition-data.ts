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

import { useCallback, useReducer } from 'react';
import { map, filter } from 'lodash';
import { useDraft } from '../hooks';
import { MailMessage } from '../db/mail-message';
import { Participant } from '../db/mail-db-types';
import { hooks } from '@zextras/zapp-shell';

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

export type ResetAction = {
	type: 'RESET';
	payload: {
		draft: CompositionState;
	};
};

export type ToggleRichTextAction = {
	type: 'TOGGLE_RICH_TEXT';
	payload: {
		richText: boolean;
	};
};

export type CompositionAction = UpdateSubjectAction
	| UpdateContactsAction
	| UpdateBodyAction
	| ResetAction
	| ToggleRichTextAction;

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
};

export type CompositionData = {
	compositionData: CompositionState;
	actions: {
		updateSubject: (value: string) => void;
		updateContacts: (type: 'to' |	'cc' | 'bcc', value: Array<{ value: string }>) => void;
		updateBody: (value: [string, string]) => void;
		toggleRichText: (richText: boolean) => void;
	};
}

const init = (initialArg: Partial<CompositionState>): CompositionState => ({
	to: [],
	cc: [],
	bcc: [],
	subject: '',
	body: { text: '', html: '' },
	richText: true,
	...initialArg
});

const draftContactsFromState = (state: CompositionState): Array<Participant> => [
	...map(state.to, (c: { value: string }): Participant => ({
		type: 't',
		address: c.value,
		displayName: ''
	}) as Participant),
	...map(state.cc, (c: { value: string }): Participant => ({
		type: 'c',
		address: c.value,
		displayName: ''
	}) as Participant),
	...map(state.bcc, (c: { value: string }): Participant => ({
		type: 'b',
		address: c.value,
		displayName: ''
	}) as Participant)
];

const compositionToDraft = (cState: CompositionState): MailMessage => ({
	subject: cState.subject,
	contacts: draftContactsFromState(cState),
});
const reducer = (state: CompositionState, action: CompositionAction): CompositionState => {
	switch (action.type) {
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
					html: action.payload.html,
					text: action.payload.text
				}
			};
		}
		case 'TOGGLE_RICH_TEXT': {
			return {
				...state,
				richText: action.payload.richText
			};
		}
		default:
			console.warn('unrecognized action type');
			return state;
	}
};

const stateContactsFromDraft = (draft: MailMessage, type: string): Array<{ value: string }> => map(
	filter(draft.contacts, (c) => c.type === type),
	(c: Participant) => ({ value: c.displayName || c.address })
);

const draftToCompositionData = (draft: MailMessage): CompositionState => ({
	subject: draft.subject,
	to: stateContactsFromDraft(draft, 't'),
	cc: stateContactsFromDraft(draft, 'c'),
	bcc: stateContactsFromDraft(draft, 'b'),
	body: {
		html: '',
		text: ''
	},
	richText: true
});

const useCompositionData = (draftId: string, panel: boolean, folderId: string): CompositionData => {
	const { db } = hooks.useAppContext();
	const replaceHistory = hooks.useReplaceHistoryCallback();
	if (draftId === 'new') {
		db.createEmptyDraft().then((newId: string): void => {
			replaceHistory(panel
				? `/folder/${folderId}?edit=${newId}`
				: `/edit/${newId}`);
		});
	}
	const draftQuery = useCallback(
		() => db.messages.get(draftId).then((res: [MailMessage, boolean]) => {
			if (res[1]) return draftToCompositionData(res[0]);
			return init({});
		}),
		[draftId, db.messages]
	);
	const draft = hooks.useObserveDb(draftQuery, db);

	const [compositionData, dispatch] = useReducer(reducer, draft, init);
	const updateSubject = useCallback(
		(value: string): void => {
			dispatch({ type: 'UPDATE_SUBJECT', payload: { value } });
		},
		[]
	);
	const updateBody = useCallback(
		(value: [string, string]): void => {
			dispatch({ type: 'UPDATE_BODY', payload: { html: value[0], text: value[1] } });
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
	console.log(compositionData);
	return {
		compositionData,
		actions: {
			updateSubject,
			updateContacts,
			updateBody,
			toggleRichText
		}
	};
};

export default useCompositionData;
