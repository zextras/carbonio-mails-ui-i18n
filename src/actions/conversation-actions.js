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

import { convAction } from '../store/actions';
import { fail, success } from './message-actions';

export function setConversationsFlag(ids, value, t, dispatch) {
	return {
		icon: value ? 'FlagOutline' : 'Flag',
		label: value ? t('Unflag') : t('Flag'),
		action: () => {
			dispatch(
				convAction({
					operation: `${value ? '!': ''}flag`,
					ids,
				}),
			);
		}
	}
}

export function setConversationsRead(ids, value, t, dispatch) {
	return {
		icon: value ? 'EmailOutline' : 'EmailReadOutline',
		label: value ? t('Mark as unread') : t('Mark as read'),
		action: () => {
			dispatch(
				convAction({
					operation: `${value ? '!': ''}read`,
					ids,
				}),
			);
		}
	}
}

export function moveConversationToTrash(ids, t, dispatch, createSnackbar)  {
	return {
		icon: 'Trash2Outline',
		label: t('Delete'),
		action: () => {
			dispatch(
				convAction({
					operation: `trash`,
					ids,
				}),
			).then((res) => {
				if (res.type.includes('fulfilled')) success({ createSnackbar, t });
				else fail({ createSnackbar, t });
			});
		}
	}
}

