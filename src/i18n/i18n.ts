/* eslint-disable @typescript-eslint/camelcase */
/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2019 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import { registerLanguage } from '@zextras/zapp-shell/utils';
import translations_en from './com_zextras_zapp_mails_en.properties';
import translations_it from './com_zextras_zapp_mails_it.properties';

export const registerTranslations = (): void => {
	registerLanguage(translations_en, 'en');
	registerLanguage(translations_it, 'it');
};
