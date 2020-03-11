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
import { map, reduce } from 'lodash';
import { MailMessage, Participant } from '../../idb/IMailsIdb';

export type CompositionData = {
	to: CompositionParticipants;
	cc: CompositionParticipants;
	bcc: CompositionParticipants;
	subject: string;
	body: string;
	priority: boolean;
}

export type CompositionParticipants = Array<{ value: string }>;

export type CompositionDataWithFn = CompositionData & {
	onFileLoad: (ev: ChangeEvent, files: FileList) => void;
	html: boolean;
	onSend: () => void;
	onParticipantChange: (field: 'to' | 'cc' | 'bcc', value: CompositionParticipants) => void;
	onModeChange: (mode: boolean) => void;
	onPriorityChange: (priority: boolean) => void;
}

export type DispatchAction = ResetDispatch | UpdateDispatch | InitDispatch

export type ResetDispatch = {
	type: 'reset';
	newState?: CompositionData;
}

export type UpdateDispatch = {
	type: 'update';
	field: 'to' | 'cc' | 'bcc' | 'subject' | 'body' | 'priority';
	value: string | CompositionParticipants | boolean;
}

export type InitDispatch = {
	type: 'init';
	data: CompositionData;
}

const emptyMail: CompositionData = {
	priority: false,
	to: [],
	cc: [],
	bcc: [],
	subject: '',
	body: '',
};

function reducer(state: CompositionData, action: DispatchAction) {
	switch (action.type) {
		case 'init': {
			if ((action as InitDispatch).data) {
				return {
					...emptyMail,
					...action.data
				};
			}
			return state;
		}
		case 'update': {
			if ((action as UpdateDispatch).field
				&& (action as UpdateDispatch).value) {
				return {
					...state, [action.field]: action.value
				};
			}
			console.warn('Invalid action dispatch');
			return state;
		}
		case 'reset': return {
			...emptyMail
		};
		default: return state;
	}
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
	const [data, dispatch] = useReducer(reducer, { ...emptyMail });
	const [richText, setRichText] = useState(false);
	useEffect(
		() => {
			if (id === 'new') {
				console.log('create-draft');
			}
			else {
				mailsSrvc.getMessages([id], false)
					.then(
						(result: { [id: string]: MailMessage }) => {
							if (result[id]) {
								const to = normalizeParticipants('t', result[id].contacts);
								const cc = normalizeParticipants('c', result[id].contacts);
								const bcc = normalizeParticipants('b', result[id].contacts);
								dispatch(
									{
										type: 'init',
										data: {
											priority: result[id].urgent,
											to,
											cc,
											bcc,
											subject: result[id].subject,
											body: '',
										}
									}
								);
							}
						}
					);
			}
		},
		[id, mailsSrvc]
	);
	const onFileLoad = useCallback((ev, files) => {
		console.debug(files);
		Promise.all(
			map(
				files,
				(file) => mailsSrvc.uploadAttachment(file)
			)
		);
	}, []);
	console.log(data);
	return {
		html: richText,
		to: data.to,
		cc: data.cc,
		bcc: data.bcc,
		subject: data.subject,
		body: data.body,
		priority: data.priority,
		onFileLoad,
		onSend: console.log,
		onParticipantChange: (field: 'to' | 'cc' | 'bcc', value: CompositionParticipants): void => dispatch({ type: 'update', field, value }),
		onModeChange: setRichText,
		onPriorityChange: (value: boolean): void => dispatch({ type: 'update', field: 'priority', value })
	};
}
/**
 * start:
 * getDraft //DONE
 * -> yep -> set data //DONE
 * -> nop -> init data
 */
