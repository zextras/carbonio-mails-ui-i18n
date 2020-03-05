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

import { registerItemAction } from '@zextras/zapp-shell/itemActions';

const registerActions: (() => void) = () => {
	registerItemAction(
		'conversation-list',
		{
			icon: 'EmailOutline',
			id: 'test-action-2',
			label: 'TEST again',
			onActivate: (obj: any): void => console.info('EmailOutline', obj),
		}
	);
	registerItemAction(
		'conversation-list',
		{
			icon: 'Activity',
			id: 'test-action',
			label: 'TEST',
			onActivate: (obj: any): void => console.info('Activity', obj),
		}
	);
};

export default registerActions;
