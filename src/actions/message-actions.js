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

import { doMsgAction } from '../store/messages-slice';

export function setFlag({
	dispatch, createSnackbar, t, msgId
}) {
	dispatch(
		doMsgAction({
			operation: 'flag',
			messageId: msgId,
		}),
	).then(() => {
		const ref = createSnackbar(
			{ key: 1, type: 'success', label: t('The operation has been successfully completed') },
		);
	},).catch(() => {
		const ref = createSnackbar({ key: 1, type: 'error', label: t('Operation failed') });
		setTimeout(ref, 1000);
	},);
}
