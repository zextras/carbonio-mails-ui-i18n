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

import { createAsyncThunk } from '@reduxjs/toolkit';
import { network } from '@zextras/zapp-shell';
import {
	dropRight, find, join, map, set, split
} from 'lodash';
import {
	SaveDraftRequest, SaveDraftResponse, SoapDraftMessageObj, SoapEmailMessagePartObj
} from '../../types/soap';
import { Participant, ParticipantRole } from '../../types/participant';
import { StateType } from '../../types/state';
import { MailsEditor } from '../../types/mails-editor';

const generateRequest = (editor: MailsEditor): SoapDraftMessageObj => ({
	id: editor.draft.id === 'new' ? undefined : editor.draft.id,
	su: { _content: editor.draft.subject },
	e: map(
		[
			editor.from,
			...map<{ value: string }, Participant | { address: string; type: ParticipantRole }>(
				editor.to,
				({ value }) => find(editor.draft.participants, ['address', value]) ?? ({ address: value, type: ParticipantRole.TO })
			),
			...map<{ value: string }, Participant | { address: string; type: ParticipantRole }>(
				editor.cc,
				({ value }) => find(editor.draft.participants, ['address', value]) ?? ({ address: value, type: ParticipantRole.CARBON_COPY })
			),
			...map<{ value: string }, Participant | { address: string; type: ParticipantRole }>(
				editor.bcc,
				({ value }) => find(editor.draft.participants, ['address', value]) ?? ({ address: value, type: ParticipantRole.BLIND_CARBON_COPY })
			)
		],
		(c) => ({
			t: c.type,
			a: c.address,
			d: (c as unknown as Participant).fullName
				?? (c as unknown as Participant).name
				?? undefined
		})
	),
	mp: [((): SoapEmailMessagePartObj => {
		const part = (editor.richText ? {
			ct: 'multipart/alternative',
			mp: [
				{
					ct: 'text/html',
					content: { _content: editor.html }
				},
				{
					ct: 'text/plain',
					content: { _content: editor.text }
				}
			]
		} : {
			ct: 'text/plain',
			body: true,
			content: { _content: editor.text }
		}) as SoapEmailMessagePartObj;
		if (editor.draft.id !== 'new' && editor.draft.bodyPath !== '') {
			return set<SoapEmailMessagePartObj>(editor.draft.parts, join(dropRight(split(editor.draft.bodyPath, '.')), '.'), part);
		}
		return part;
	})()
	]
});

export type SaveDraftParameters = {
	editorId: string;
	send: boolean;
}

export const saveDraft = createAsyncThunk<any, SaveDraftParameters>(
	'saveDraft',
	async ({ editorId, send }, { getState }) => {
		const editor = (getState() as StateType).editors.editors[editorId];
		const resp = await network.soapFetch<SaveDraftRequest, SaveDraftResponse>(
			send ? 'SendMsg' : 'SaveDraft',
			{
				_jsns: 'urn:zimbraMail',
				m: generateRequest(editor)
			}
		);
		return { resp, editorId, send };
	}
);
