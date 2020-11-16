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

export function setConvFlag({
	dispatch, createSnackbar, t, ids, value = true
}) {
	dispatch(
		convAction({
			operation: `${value ? '' : '!'}flag`,
			ids: [ids],
		}),
	).then((res) => {
		if (res.type.includes('fulfilled')) success({ createSnackbar, t });
		else fail({ createSnackbar, t });
	});
}

export function setConvRead({
	dispatch, createSnackbar, t, ids, value
}) {
	dispatch(
		convAction({
			operation: `${value ? '' : '!'}read`,
			ids: [ids],
		}),
	).then((res) => {
		if (res.type.includes('fulfilled')) success({ createSnackbar, t });
		else fail({ createSnackbar, t });
	});
}

export function setConvTag({
	dispatch, createSnackbar, t, ids, value, tagName
}) {
	dispatch(
		convAction({
			operation: `${value ? '' : '!'}tag`,
			ids: [ids],
			tn: tagName,
		}),
	).then((res) => {
		if (res.type.includes('fulfilled')) success({ createSnackbar, t });
		else fail({ createSnackbar, t });
	});
}

export function moveTo({
	dispatch, createSnackbar, t, ids, folderId
}) {
	dispatch(
		convAction({
			operation: 'move',
			ids: [ids],
			parent: folderId,
		}),
	).then((res) => {
		if (res.type.includes('fulfilled')) success({ createSnackbar, t });
		else fail({ createSnackbar, t });
	});
}

export function moveToTrash({
	dispatch, createSnackbar, t, ids, folderId
}) {
	dispatch(
		convAction({
			operation: 'trash',
			ids: [ids],
		}),
	).then((res) => {
		if (res.type.includes('fulfilled')) success({ createSnackbar, t });
		else fail({ createSnackbar, t });
	});
}

function success({ createSnackbar, t }) {
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

function fail({ createSnackbar, t }) {
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
