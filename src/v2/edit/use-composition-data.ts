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

import { useCallback, useEffect, useReducer } from 'react';
import { useDraft } from '../hooks';

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

const useCompositionData = (editPanelId: string): CompositionData => {
	const { draft } = useDraft(editPanelId);

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
