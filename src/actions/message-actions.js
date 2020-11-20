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

import { convAction, msgAction } from '../store/actions';

export function success(t, createSnackbar) {
	const ref = createSnackbar(
		{
			key: String(Date.now()),
			replace: true,
			type: 'success',
			label: t('The operation has been successfully completed'),
			autoHideTimeout: 2000
		},
	);
}

export function fail(t, createSnackbar) {
	const ref = createSnackbar(
		{
			key: String(Date.now()),
			replace: true,
			type: 'error',
			label: t('Operation failed'),
			autoHideTimeout: 2000
		},
	);
}

export function setMsgRead(ids, value, t, dispatch)  {
	return {
		icon: value ? 'EmailOutline' : 'EmailReadOutline',
		label: value ? t('Mark as read') : t('Mark as unread'),
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
		label: value ? t('Unflag') : t('Flag'),
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

export function moveMsgToTrash(ids, t, dispatch, createSnackbar)  {
	return {
		icon: 'Trash2Outline',
		label: t('Delete'),
		action: () => {
			let notCanceled = true;

			const infoSnackbar = (remainingTime, hideButton = false) => {
				const ref = createSnackbar(
					{
						key: `trash-${ids}`,
						replace: true,
						type: 'info',
						label: t(`This e-mail will be deleted in ${remainingTime} seconds`),
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
						convAction({
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
									label: t('E-mail successfully deleted!'),
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
									label: t('Something went wrong, this conversation has not be deleted, please retry'),
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
		label: t('Delete'),
		action: () => {
			console.log('TODO');
			// TODO
		}
	}
}

export function replyMsg(messageId, folderId, t, replaceHistory) {
	return {
		icon: 'UndoOutline',
		label: t('Reply'),
		action: () => {
			replaceHistory(`/folder/${folderId}?edit=new&action=reply&actionId=${messageId}`);
		}
	}
}

export function replyAllMsg(messageId, folderId, t, replaceHistory) {
	return {
		icon: 'ReplyAll',
		label: t('Reply All'),
		action: () => {
			replaceHistory(`/folder/${folderId}?edit=new&action=replyAll&actionId=${messageId}`);
		}
	}
}

export function forwardMsg(messageId, folderId, t, replaceHistory) {
	return {
		icon: 'Forward',
		label: t('Forward'),
		action: () => {
			replaceHistory(`/folder/${folderId}?edit=new&action=forward&actionId=${messageId}`);
		}
	}
}

export function editAsNewMsg(messageId, folderId, t, replaceHistory) {
	return {
		icon: 'Edit2Outline',
		label: t('Edit as new'),
		action: () => {
			replaceHistory(`/folder/${folderId}?edit=new&action=editAsNew&actionId=${messageId}`)
		}
	}
}

export function editDraft(messageId, folderId, t, replaceHistory) {
	return {
		icon: 'Edit2Outline',
		label: 'Edit draft',
		action: () => {
			replaceHistory(`/folder/${folderId}?edit=${messageId}`);
		}
	}
}
