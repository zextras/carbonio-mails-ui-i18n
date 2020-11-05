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
import { Account, hooks } from '@zextras/zapp-shell';
import moment from 'moment';
import { MailMessagePart, MailMessageFromDb, ParticipantType } from '../db/mail-message';
import { Participant } from '../db/mail-db-types';
import { CompositionData, CompositionState, emptyDraft } from './composition-types';
import { useMessage } from '../hooks';
import { report } from '../commons/report-exception';
import useQueryParam from '../hooks/useQueryParam';
import { MailsDb } from '../db/mails-db';

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
		type: 'to' | 'cc' | 'bcc';
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
				richText: !action.payload.richText
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
			report(new Error('useCompositionData: unrecognized action type'));
			return state;
	}
};

export const stateContactsFromDraft = (draft: MailMessageFromDb, type: string):
	Array<{ value: string }> =>
	map(
		filter(draft ? draft.contacts : [], (c) => c.type === type),
		(c: Participant) => ({ value: c.address })
	);

function isHtml(parts: Array<MailMessagePart>): boolean {
	function subtreeContainsHtmlParts(part: MailMessagePart): boolean {
		if (part.contentType === 'text/html') return true;
		return part.parts ? part.parts.some(subtreeContainsHtmlParts) : false;
	}
	return parts.some(subtreeContainsHtmlParts);
}

function recursiveFindText(parts: Array<MailMessagePart>): MailMessagePart | undefined {
	function findText(part: MailMessagePart): MailMessagePart | undefined {
		if (part.contentType === 'text/plain') return part;
		return part.parts && recursiveFindText(part.parts);
	}
	return parts.find(findText);
}

export const extractBody = (draft: MailMessageFromDb): { text: string; html: string } => {
	const text = recursiveFindText(draft.parts);
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
	richText: isHtml(draft.parts),
	flagged: draft ? draft.flagged : false,
	urgent: draft ? draft.urgent : false
});

function handleSaveDraft(
	db: MailsDb,
	id: string,
	cData: CompositionState,
	action: string, actionId: string,
	t: (key: string) => string,
	accounts: Account[]
): Promise<string> {
	const draftResponse: CompositionState = { ...emptyDraft };
	if (action) {
		if (action === 'editAsNew') {
			return db.messages.where({ id: actionId }).first().then((message) => {
				if (message) {
					draftResponse.subject = message.subject;
					console.log(message.parts);
					const body = extractBody(message);
					draftResponse.richText = isHtml(message.parts);

					draftResponse.body.text = body.text;
					draftResponse.body.html = body.html;
					return db.saveDraftFromAction(draftResponse, message.conversation, accounts);
				}
				throw new Error('MessageId not found');
			});
		}
		return db.messages.where({ id: actionId }).first().then((message) => {
			if (message) {
				if (action === 'reply' || action === 'replyAll') {
					let to = message.contacts.filter((m) => m.type === ParticipantType.REPLY_TO);
					if (to.length < 1) {
						to = message.contacts.filter((m) => m.type === ParticipantType.FROM);
					}
					draftResponse.to = to.map((m) => ({ value: m.address }));
					if (message.subject.startsWith('Re:')) draftResponse.subject = `${message.subject}`;
					else draftResponse.subject = `Re: ${message.subject}`;
				}

				if (action === 'replyAll') {
					draftResponse.cc = message.contacts
						.filter((m) =>
							(m.type === ParticipantType.CARBON_COPY || m.type === ParticipantType.TO))
						.filter((m) => !(accounts.map((a) => a.name).includes(m.address)))
						.map((m) => ({ value: m.address }));
				}

				if (action === 'forward') {
					draftResponse.subject = `Fwd: ${message.subject}`;
					// TODO: attachments
				}

				draftResponse.richText = isHtml(message.parts);

				const body = extractBody(message);

				const from = message.contacts
					.filter((m) => m.type === ParticipantType.FROM)
					.map((c) => `"${c.displayName}" <${c.address}>`)
					.join(', ');

				const to = message.contacts
					.filter((m) => m.type === ParticipantType.TO)
					.map((c) => `"${c.displayName}" <${c.address}>`)
					.join(', ');

				const cc = message.contacts
					.filter((m) => m.type === ParticipantType.CARBON_COPY)
					.map((c) => `"${c.displayName}" <${c.address}>`)
					.join(', ');

				const date = moment(message.date).format('LLLL');

				let bodyHtml = `<br /><br /><hr><b>${t('From')}:</b> ${from} <br /> <b>${t('To')}:</b> ${to} <br />`;
				let bodyText = `\n\n---------------------------\n${t('From')}: ${from}\n${t('To')}: ${to}\n`;

				if (cc.length > 0) {
					bodyHtml = bodyHtml.concat(`<b>${t('Cc')}</b> ${cc}<br />`);
					bodyText = bodyText.concat(`${t('Cc')}: ${cc}\n`);
				}

				draftResponse.body.html = bodyHtml.concat(`<b>${t('Sent')}:</b> ${date} <br /> <b>${t('Subject')}:</b> ${message.subject} <br /><br />${body.html}`);
				draftResponse.body.text = bodyText.concat(`${t('Sent')}: ${date}\n${t('Subject')}: ${message.subject}\n\n${body.text}`);

				return db.saveDraftFromAction(
					draftResponse,
					message.conversation,
					accounts
				);
			}
			throw new Error('Message not found');
		});
	}
	return db.saveDraft(id, cData, accounts);
}

const useCompositionData = (
	draftId: string,
	panel: boolean,
	folderId: string,
	t: (key: string) => string
): CompositionData => {
	const { db } = hooks.useAppContext();
	const replaceHistory = hooks.useReplaceHistoryCallback();
	const accounts = hooks.useUserAccounts();
	const [initialized, setInitialized] = useState(false);

	const action = useQueryParam('action') || '';
	const actionId = useQueryParam('actionId') || '';

	const [draft, loaded] = useMessage(draftId);
	const [compositionData, dispatch] = useReducer(
		reducer,
		(draft && loaded) ? draftToCompositionData(draft) : emptyDraft
	);
	const timedSaveDraft = useCallback(
		throttle(
			// eslint-disable-next-line arrow-body-style
			(dId: string, cData: CompositionState) => {
				return handleSaveDraft(db, dId, cData, action, actionId, t, accounts)
					.then((newId: string): void => {
						if (newId !== dId) {
							replaceHistory(panel
								? `/folder/${folderId}?edit=${newId}`
								: `/edit/${newId}`);
						}
					})
					.catch(report); // TODO: here returns error of Id's not found
			},
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
