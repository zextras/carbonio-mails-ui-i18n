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
	useMemo
} from 'react';
import { hooks } from '@zextras/zapp-shell';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { CompositionData } from './composition-types';
import { useMessage } from '../hooks';
import useQueryParam from '../hooks/useQueryParam';
import {
	selectEditors,
	toggleRichText,
	updateEditor,
	updateParticipants,
	updateBody,
	saveDraft,
	sendMail,
	openEditor
} from '../store/editor-slice';

let counter = 0;

const getNewEditId = (id: string): string => {
	counter += 1;
	return `${id}-${counter}`;
};

const useCompositionData = (
	draftId: string,
	panel: boolean,
	folderId: string,
	t: (key: string) => string
): CompositionData => {
	const action = useQueryParam('action');
	const actionId = useQueryParam('actionId');
	const accounts = hooks.useUserAccounts();
	const dispatch = useDispatch();
	const editorId = useMemo(() => getNewEditId(draftId), [draftId]);
	const original = useMessage(draftId);
	const actionMail = useMessage(actionId ?? '');
	useEffect(() => {
		dispatch(openEditor({
			id: editorId,
			original,
			action,
			actionMail,
			accounts,
			labels: {
				to: t('To'), from: t('From'), cc: t('CC'), subject: t('Subject'), sent: t('Sent')
			}
		}));
	}, [accounts, action, actionMail, dispatch, editorId, original, t]);

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
	const updateContactsCb = useCallback(
		(type: 'to' | 'cc' | 'bcc', value: Array<{ value: string }>): void => {
			dispatch(updateParticipants({ id: editorId, type, contacts: value }));
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
		() => dispatch(saveDraft({ id: editorId })),
		[dispatch, editorId]
	);
	const sendMailCb = useCallback(
		() => dispatch(sendMail({ id: editorId })),
		[dispatch, editorId]
	);
	return {
		compositionData,
		actions: {
			updateSubjectCb,
			updateContactsCb,
			updateBodyCb,
			toggleRichTextCb,
			toggleUrgentCb,
			toggleFlaggedCb,
			sendMailCb,
			saveDraftCb
		}
	};
};

export default useCompositionData;
