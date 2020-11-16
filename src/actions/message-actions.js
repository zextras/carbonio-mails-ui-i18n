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

export function setMsgFlag({
	dispatch, createSnackbar, t, msgId
}) {
	dispatch(
		msgAction({
			operation: 'flag',
			ids: [msgId],
		}),
	).then((res) => {
		if (res.type.includes('fulfilled')) {
			const ref = createSnackbar(
				{
					key: String(Date.now()), replace: true, type: 'success', label: t('The operation has been successfully completed'), autoHideTimeout: 2000
				},
			);
		}
		else {
			const ref = createSnackbar(
				{
					key: String(Date.now()), replace: true, type: 'error', label: t('Operation failed'), autoHideTimeout: 2000
				},
			);
		}
	});
}
