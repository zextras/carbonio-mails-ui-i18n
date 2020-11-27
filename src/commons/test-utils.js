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

export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fulfilledWhen(condition) {
	while (!condition()) {
		// eslint-disable-next-line no-await-in-loop
		await sleep(10);
	}
	return new Promise(resolve => resolve());
}

