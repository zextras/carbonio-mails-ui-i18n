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
export interface ISaveDraftRequest {
	m: {
		e: Array<IMailContact>;
		mp: Array<IDraftMP>;
		id?: string;
		su: string;
	};
}

export interface IMailContact {
	t: 't' // to
	| 'c' // cc
	| 'f';// from
	a: string;
}

export interface IDraftMP {
	ct: 'text/plain';
	content: {
		_content: string;
	};
}

export interface ISaveDraftResponse {
	m: {
		id: string;
	};
}
