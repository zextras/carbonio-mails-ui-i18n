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

import { msgAction } from '../store/actions';

export function setMsgRead(ids, value, t, dispatch)  {
	return {
		icon: value ? 'EmailOutline' : 'EmailReadOutline',
		label: value ? t('action.mark_as_unread') : t('action.mark_as_read'),
		action: () => {
			dispatch(
				msgAction({
					operation: `${value ? '!': ''}read`,
					ids,
				}),
			);
		}
	}
}

export function setMsgFlag(ids, value, t, dispatch) {
	return {
		icon: value ? 'FlagOutline' : 'Flag',
		label: value ? t('action.unflag') : t('action.flag'),
		action: () => {
			dispatch(
				msgAction({
					operation: `${value ? '!': ''}flag`,
					ids,
				}),
			);
		}
	}
}

export function moveMsgToTrash(ids, t, dispatch, createSnackbar) {
	return {
		icon: 'Trash2Outline',
		label: t('action.delete'),
		action: () => {
			let notCanceled = true;

			const infoSnackbar = (remainingTime, hideButton = false) => {
				const ref = createSnackbar(
					{
						key: `trash-${ids}`,
						replace: true,
						type: 'info',
						label: t('messages.snackbar.message_will_be_deleted_in_time', { remainingTime }),
						autoHideTimeout: 2000,
						hideButton,
						actionLabel: 'Undo',
						onActionClick: () => {
							notCanceled = false;
						}
					},
				);
			}
			infoSnackbar(3);

			setTimeout(() => notCanceled && infoSnackbar(2), 1000);
			setTimeout(() => notCanceled && infoSnackbar(1), 2000);

			setTimeout(() => {
				if(notCanceled) {
					dispatch(
						msgAction({
							operation: `trash`,
							ids,
						}),
					).then((res) => {
						if (res.type.includes('fulfilled')) {
							const ref = createSnackbar(
								{
									key: `trash-${ids}`,
									replace: true,
									type: 'success',
									label: t('messages.snackbar.message_deleted'),
									autoHideTimeout: 3000,
								},
							);
						}
						else {
							const ref = createSnackbar(
								{
									key: `trash-${ids}`,
									replace: true,
									type: 'error',
									label: t('messages.snackbar.message_delete_error'),
									autoHideTimeout: 3000,
								},
							);
						}
					});
				}
			}, 3000);
		}
	}
}

export function deleteMsg(ids, t, dispatch) {
	return {
		icon: 'Trash2Outline',
		label: t('action.delete'),
		action: () => {
			console.log('TODO');
			// TODO
		}
	}
}

export function replyMsg(messageId, folderId, t, replaceHistory) {
	return {
		icon: 'UndoOutline',
		label: t('action.reply'),
		action: () => {
			replaceHistory(`/folder/${folderId}?edit=new&action=reply&actionId=${messageId}`);
		}
	}
}

export function replyAllMsg(messageId, folderId, t, replaceHistory) {
	return {
		icon: 'ReplyAll',
		label: t('action.reply_all'),
		action: () => {
			replaceHistory(`/folder/${folderId}?edit=new&action=replyAll&actionId=${messageId}`);
		}
	}
}

export function forwardMsg(messageId, folderId, t, replaceHistory) {
	return {
		icon: 'Forward',
		label: t('action.forward'),
		action: () => {
			replaceHistory(`/folder/${folderId}?edit=new&action=forward&actionId=${messageId}`);
		}
	}
}

export function editAsNewMsg(messageId, folderId, t, replaceHistory) {
	return {
		icon: 'Edit2Outline',
		label: t('action.edit_as_new'),
		action: () => {
			replaceHistory(`/folder/${folderId}?edit=new&action=editAsNew&actionId=${messageId}`)
		}
	}
}

export function editDraft(messageId, folderId, t, replaceHistory) {
	return {
		icon: 'Edit2Outline',
		label: t('action.edit_as_draft'),
		action: () => {
			replaceHistory(`/folder/${folderId}?edit=${messageId}`);
		}
	}
}
