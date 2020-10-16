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

export type CompositionState = {
	to: Array<{ value: string}>;
	cc: Array<{ value: string}>;
	bcc: Array<{ value: string}>;
	subject: string;
	body: {
		text: string;
		html: string;
	};
	richText: boolean;
	flagged: boolean;
	urgent: boolean;
};

export type CompositionData = {
	compositionData: CompositionState;
	actions: {
		updateSubject: (value: string) => void;
		updateContacts: (type: 'to' |	'cc' | 'bcc', value: Array<{ value: string }>) => void;
		updateBody: (value: [string, string]) => void;
		toggleRichText: (richText: boolean) => void;
		toggleFlagged: (flagged: boolean) => void;
		toggleUrgent: (urgent: boolean) => void;
		sendMail: () => void;
	};
};

export const emptyDraft: CompositionState = {
	richText: true,
	subject: '',
	urgent: false,
	flagged: false,
	to: [],
	cc: [],
	bcc: [],
	body: {
		text: '',
		html: ''
	}
};
