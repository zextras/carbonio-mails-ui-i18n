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
export type ISaveDraftRequest = {
	m: {
		e: Array<IMailContact>;
		mp: Array<IMailMP>;
		id?: string;
		su: string;
	};
};

export type ISendMailRequest = {
	m: {
		e: Array<IMailContact>;
		mp: Array<IMailMP>;
		did?: string;
		su: string;
	};
};

export type IMailContact = {
	t: 't' // to
	| 'c' // cc
	| 'f';// from
	a: string;
};

export type IMailMP = {
	ct: 'text/plain';
	content: {
		_content: string;
	};
};

export type ISaveDraftResponse = {
	m: Array<{ id: string	}>;
};
