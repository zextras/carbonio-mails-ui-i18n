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
			let notCanceled = true;

			const infoSnackbar = (remainingTime, hideButton = false) => {
				const ref = createSnackbar(
					{
						key: `trash-${ids}`,
						replace: true,
						type: 'info',
						label: t(`This conversation will be deleted in ${remainingTime} seconds`),
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
									label: t('Conversation successfully deleted!'),
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
