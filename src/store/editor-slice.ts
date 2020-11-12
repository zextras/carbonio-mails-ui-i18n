/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Account } from '@zextras/zapp-shell';
import produce from 'immer';
import {
	filter, find, map, merge, reject
} from 'lodash';
import moment from 'moment';
import { Participant } from 'src/db/mail-db-types';
import { MailMessageFromSoap, ParticipantType } from '../db/mail-message';
import { StateType, EditorsStateType, MailsEditorMap } from '../types/state';
import { emptyEditor, extractBody, isHtml } from './editor-slice-utils';

type OpenEditorPayload = {
	id: string;
	original: MailMessageFromSoap;
	action: string | undefined;
	actionMail: MailMessageFromSoap;
	accounts: Array<Account>;
	labels: {
		to: string;
		from: string;
		cc: string;
		subject: string;
		sent: string
	}
}

function openEditorReducer(
	state: EditorsStateType,
	{ payload }: { payload: OpenEditorPayload }
): void {
	const editor = emptyEditor(payload.id, payload.accounts);
	if (payload.action && payload.actionMail) {
		switch (payload.action) {
			case 'editAsNew': {
				editor.draft.subject = payload.actionMail.subject;
				const body = extractBody(payload.actionMail);
				editor.richText = isHtml(payload.actionMail.parts);
				editor.text = body.text;
				editor.html = body.html;
				break;
			}
			case 'reply': {
				let contactTo = filter(
					payload.actionMail.contacts,
					(m) => m.type === ParticipantType.REPLY_TO
				);
				if (contactTo.length < 1) {
					contactTo = filter(
						payload.actionMail.contacts,
						(m) => m.type === ParticipantType.FROM
					);
				}
				editor.draft.contacts.push(
					...map(
						contactTo,
						(c: Participant): Participant => ({ ...c, type: ParticipantType.TO })
					)
				);
				if (payload.actionMail.subject.startsWith('Re:')) editor.draft.subject = `${payload.actionMail.subject}`;
				else editor.draft.subject = `Re: ${payload.actionMail.subject}`;
				break;
			}
			case 'replyAll': {
				let contactTo = filter(
					payload.actionMail.contacts,
					(c) => c.type === ParticipantType.REPLY_TO
				);
				if (contactTo.length < 1) {
					contactTo = filter(
						payload.actionMail.contacts,
						(c) => c.type === ParticipantType.FROM
					);
				}
				const contactCc = filter(
					payload.actionMail.contacts,
					(c) => (c.type === ParticipantType.CARBON_COPY || c.type === ParticipantType.TO) && !find(payload.accounts, ['id', c.address])
				);
				editor.draft.contacts.push(
					...map(contactTo, (c) => ({ ...c, type: ParticipantType.TO })),
					...map(contactCc, (c) => ({ ...c, type: ParticipantType.CARBON_COPY }))
				);
				if (payload.actionMail.subject.startsWith('Re:')) editor.draft.subject = `${payload.actionMail.subject}`;
				else editor.draft.subject = `Re: ${payload.actionMail.subject}`;
				break;
			}
			case 'forward': {
				editor.draft.subject = `Fwd: ${payload.actionMail.subject}`;
				break;
			}
			default: {
				break;
			}
		}
		editor.richText = isHtml(payload.actionMail.parts);
		const { text, html } = extractBody(payload.actionMail);

		if (payload.action !== 'editAsNew') {
			const headingFrom = map(
				filter(payload.actionMail.contacts, ['type', ParticipantType.FROM]),
				(c) => `"${c.displayName}" <${c.address}>`
			).join(', ');
			const headingTo = map(
				filter(payload.actionMail.contacts, ['type', ParticipantType.TO]),
				(c) => `"${c.displayName}" <${c.address}>`
			).join(', ');
			const headingCc = map(
				filter(payload.actionMail.contacts, ['type', ParticipantType.CARBON_COPY]),
				(c) => `"${c.displayName}" <${c.address}>`
			).join(', ');

			const date = moment(payload.actionMail.date).format('LLLL');

			let bodyHtml = `<br /><br /><hr><b>${payload.labels.from}:</b> ${headingFrom} <br /> <b>${payload.labels.to}:</b> ${headingTo} <br />`;
			let bodyText = `\n\n---------------------------\n${payload.labels.from}: ${headingFrom}\n${payload.labels.to}: ${headingTo}\n`;

			if (headingCc.length > 0) {
				bodyHtml = bodyHtml.concat(`<b>${payload.labels.cc}</b> ${headingCc}<br />`);
				bodyText = bodyText.concat(`${payload.labels.cc}: ${headingCc}\n`);
			}

			editor.html = bodyHtml.concat(`<b>${payload.labels.sent}:</b> ${date} <br /> <b>${payload.labels.subject}:</b> ${payload.actionMail.subject} <br /><br />${html}`);
			editor.text = bodyText.concat(`${payload.labels.sent}: ${date}\n${payload.labels.subject}: ${payload.actionMail.subject}\n\n${text}`);
		}
		editor.draft.contacts = filter(
			editor.draft.contacts,
			(c: Participant): boolean => (c.type !== ParticipantType.FROM || !!find(payload.accounts, ['id', c.address]))
		);
	}
	else if (payload.original) {
		editor.richText = isHtml(payload.original.parts);
		const { text, html } = extractBody(payload.original);
		editor.html = html;
		editor.text = text;
		editor.draft = payload.original;
	}
	editor.to = map(filter(editor.draft.contacts, ['type', ParticipantType.TO]), (c) => ({ value: c.address }));
	editor.cc = map(filter(editor.draft.contacts, ['type', ParticipantType.CARBON_COPY]), (c) => ({ value: c.address }));
	editor.bcc = map(filter(editor.draft.contacts, ['type', ParticipantType.BLIND_CARBON_COPY]), (c) => ({ value: c.address }));
	state.editors[payload.id] = editor;
}

type UpdateEditorPayload = {
	id: string;
	mods: Partial<MailMessageFromSoap>;
}

function updateEditorReducer(
	state: EditorsStateType,
	{ payload }: { payload: UpdateEditorPayload }
): void {
	state.editors[payload.id].draft = merge(state.editors[payload.id].draft, payload.mods);
}

type CloseEditorPayload = {
	id: string;
}

function closeEditorReducer(
	state: EditorsStateType,
	{ payload }: { payload: CloseEditorPayload }
): void {
	if (state.editors[payload.id]) delete state.editors[payload.id];
}

type ToggleRichTextPayload = {
	id: string;
	richText: boolean;
}

function toggleRichTextReducer(
	state: EditorsStateType,
	{ payload }: { payload: ToggleRichTextPayload }
): void {
	state.editors[payload.id].richText = payload.richText;
}

type UpdateBodyPayload = {
	id: string;
	html: string;
	text: string;
}

function updateBodyReducer(
	state: EditorsStateType,
	{ payload }: { payload: UpdateBodyPayload }
): void {
	state.editors[payload.id].text = payload.text;
	state.editors[payload.id].html = payload.html;
}

type UpdateParticipantsPayload = {
	id: string;
	type: 'to' | 'cc' | 'bcc';
	contacts: Array<{ value: string }>;
}

function updateParticipantsReducer(
	state: EditorsStateType,
	{ payload }: { payload: UpdateParticipantsPayload }
): void {
	state.editors[payload.id][payload.type] = payload.contacts;
}

type SaveDraftPayload = {
	id: string;
}

function saveDraftReducer(
	state: EditorsStateType,
	{ payload }: { payload: SaveDraftPayload }
): void {
	console.log('gneeee', state, payload);
}
function sendMailReducer(
	state: EditorsStateType,
	{ payload }: { payload: SaveDraftPayload }
): void {
	console.log('gneeee', state, payload);
}

export const editorsSlice = createSlice({
	name: 'editors',
	initialState: {
		status: 'idle',
		editors: {} as MailsEditorMap,
	} as EditorsStateType,
	reducers: {
		openEditor: produce(openEditorReducer),
		updateEditor: produce(updateEditorReducer),
		closeEditor: produce(closeEditorReducer),
		toggleRichText: produce(toggleRichTextReducer),
		updateParticipants: produce(updateParticipantsReducer),
		updateBody: produce(updateBodyReducer),
		saveDraft: produce(saveDraftReducer),
		sendMail: produce(sendMailReducer)
	},
	extraReducers: {
	}
});

export const {
	openEditor,
	updateEditor,
	closeEditor,
	toggleRichText,
	updateParticipants,
	updateBody,
	saveDraft,
	sendMail
} = editorsSlice.actions;

export default editorsSlice.reducer;

export function selectEditors({ editors }: StateType): MailsEditorMap {
	return editors ? editors.editors : {};
}
