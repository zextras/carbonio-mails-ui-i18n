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

import { useLocation } from 'react-router-dom';

export default function useQueryParam(name: string, defaultValue?: string): string | undefined {
	return new URLSearchParams(useLocation().search).get(name) || defaultValue;
}
