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
	useMemo,
	useState
} from 'react';
import { hooks } from '@zextras/zapp-shell';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { map } from 'lodash';
import { getMsg } from '../../store/actions';
import { saveDraft } from '../../store/actions/save-draft';
import { selectMessages } from '../../store/messages-slice';
import { CompositionData } from './composition-types';
import { useQueryParam } from '../../hooks/useQueryParam';
import {
	selectEditors,
	toggleRichText,
	updateEditor,
	updateParticipants,
	updateBody,
	openEditor
} from '../../store/editor-slice';
import { sendMsg } from '../../store/actions/send-msg';
import { Participant, ParticipantRole } from '../../types/participant';

let counter = 0;

const getNewEditId = (id: string): string => {
	counter += 1;
	return `${id}-${counter}`;
};
const useChangeLog = (l: string, v: any): void => useEffect(() => console.log(`${l} changed: `, v), [l, v]);

type PartialParticipant = Partial<Participant> & { address: string };

export const useCompositionData = (
	draftId: string,
	panel: boolean,
	folderId: string,
	t: (key: string) => string
): CompositionData => {
	const messages = useSelector(selectMessages)

	const replaceHistory = hooks.useReplaceHistoryCallback();
	const closeBoard = hooks.useRemoveCurrentBoard();
	const action = useQueryParam('action');
	const actionId = useQueryParam('actionId');
	const accounts = hooks.useUserAccounts();
	const dispatch = useDispatch();
	const editorId = useMemo(() => getNewEditId(draftId), [draftId]);
	const original = messages[draftId];
	const actionMail = messages[actionId || ''];
	useEffect(() => {
		if (draftId !== 'new') {
			dispatch(getMsg({msgId: draftId}));
		}
		if(actionId) {
			dispatch(getMsg({msgId: actionId}));
		}
	}, [actionId, dispatch, draftId])
	const [editorCreated, setEditorCreated] = useState(false);
	useEffect(() => {
		if (!editorCreated) {
			dispatch(openEditor({
				id: editorId,
				original,
				action,
				actionMail,
				accounts,
				labels: {
					to: t('label.to'),
					from: t('label.from'),
					cc: t('label.cc'),
					subject: t('label.subject'),
					sent: t('label.sent')
				}
			}));
			setEditorCreated(true);
		}
	}, [accounts, action, actionMail, dispatch, editorCreated, editorId, original, t]);

	const compositionData = useSelector(
		createSelector([selectEditors], (editors) => editors[editorId])
	);

	const updateSubjectCb = useCallback(
		(value: string): void => {
			dispatch(updateEditor({ id: editorId, mods: { subject: value } }));
		},
		[dispatch, editorId]
	);
	const updateBodyCb = useCallback(
		(value: [string, string]): void => {
			dispatch(updateBody({ id: editorId, text: value[0], html: value[1] }));
		},
		[dispatch, editorId]
	);
	const updateContactsToCb = useCallback(
		(value: Array<PartialParticipant>): void => {
			console.log(value)
			dispatch(updateParticipants(
				{
					id: editorId,
					type: 'to',
					contacts: map(
						value,
						(participant: PartialParticipant): Participant => ({
							...participant,
							type: ParticipantRole.TO
						}) as Participant
					)
				}
			));
		},
		[dispatch, editorId]
	);
	const updateContactsCcCb = useCallback(
		(value: Array<PartialParticipant>): void => {
			dispatch(updateParticipants(
				{
					id: editorId,
					type: 'cc',
					contacts: map(
						value,
						(participant: PartialParticipant): Participant => ({
							...participant,
							type: ParticipantRole.CARBON_COPY
						}) as Participant
					)
				}
			));
		},
		[dispatch, editorId]
	);
	const updateContactsBccCb = useCallback(
		(value: Array<PartialParticipant>): void => {
			dispatch(updateParticipants(
				{
					id: editorId,
					type: 'bcc',
					contacts: map(
						value,
						(participant: PartialParticipant): Participant => ({
							...participant,
							type: ParticipantRole.BLIND_CARBON_COPY
						}) as Participant
					)
				}
			));
		},
		[dispatch, editorId]
	);
	const toggleRichTextCb = useCallback(
		(richText: boolean): void => {
			dispatch(toggleRichText({ id: editorId, richText }));
		},
		[dispatch, editorId]
	);
	const toggleUrgentCb = useCallback(
		(urgent: boolean): void => {
			dispatch(updateEditor({ id: editorId, mods: { urgent } }));
		},
		[dispatch, editorId]
	);
	const toggleFlaggedCb = useCallback(
		(flagged: boolean): void => {
			dispatch(updateEditor({ id: editorId, mods: { flagged } }));
		},
		[dispatch, editorId]
	);
	const saveDraftCb = useCallback(
		() => {
			dispatch(saveDraft({ editorId }));
		},
		[dispatch, editorId]
	);
	const sendMailCb = useCallback(
		() => {
			dispatch(sendMsg({ editorId }));
			if (panel) {
				replaceHistory(`/folder/${folderId}/`);
			}
			else {
				closeBoard();
			}
		},
		[closeBoard, dispatch, editorId, folderId, panel, replaceHistory]
	);
	return {
		compositionData,
		actions: {
			updateSubjectCb,
			updateContactsToCb,
			updateContactsCcCb,
			updateContactsBccCb,
			updateBodyCb,
			toggleRichTextCb,
			toggleUrgentCb,
			toggleFlaggedCb,
			sendMailCb,
			saveDraftCb
		}
	};
};
