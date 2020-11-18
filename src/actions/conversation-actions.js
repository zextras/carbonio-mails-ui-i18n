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

export function setConvFlag({ dispatch, ids, value = true }) {
	dispatch(
		convAction({
			operation: `${value ? '' : '!'}flag`,
			ids: [ids],
		}),
	);
}

export function setConvRead({ dispatch, ids, value = true }) {
	dispatch(
		convAction({
			operation: `${value ? '' : '!'}read`,
			ids: [ids],
		}),
	);
}

export function setConvTag({ dispatch,  ids, value, tagName }) {
	dispatch(
		convAction({
			operation: `${value ? '' : '!'}tag`,
			ids: [ids],
			tn: tagName,
		}),
	);
}

export function moveTo({ dispatch, createSnackbar, t, ids, folderId }) {
	dispatch(
		convAction({
			operation: 'move',
			ids: [ids],
			parent: folderId,
		}),
	);
}

export function moveToTrash({ dispatch, createSnackbar, t, ids, folderId }) {
	dispatch(
		convAction({
			operation: 'trash',
			ids: [ids],
		}),
	);
}

