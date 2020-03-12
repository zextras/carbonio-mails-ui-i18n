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


import { ChangeEvent } from 'react';

export type CompositionData = {
	to: CompositionParticipants;
	cc: CompositionParticipants;
	bcc: CompositionParticipants;
	subject: string;
	body: string;
	priority: boolean;
	attachments: Array<CompositionAttachment>
}

export type CompositionAttachment = {
	aid: string,
	file: File
}

export type CompositionParticipants = Array<{ value: string }>;

export type CompositionDataWithFn = CompositionData & {
	onFileLoad: (ev: ChangeEvent, files: FileList) => void;
	html: boolean;
	onSend: () => void;
	onParticipantChange: (field: 'to' | 'cc' | 'bcc', value: CompositionParticipants) => void;
	onModeChange: (mode: boolean) => void;
	onPriorityChange: (priority: boolean) => void;
}

export type DispatchAction = ResetDispatch
	| UpdateDispatch
	| InitDispatch
	| PriorityDispatch
	| AddAttachmentsDispatch

export type AddAttachmentsDispatch = {
	type: 'addAttachments';
	attachments: Array<CompositionAttachment>;
}

export type ResetDispatch = {
	type: 'reset';
	newState?: CompositionData;
}

export type UpdateDispatch = {
	type: 'update';
	field: 'to' | 'cc' | 'bcc' | 'subject' | 'body';
	value: string | CompositionParticipants | boolean;
}

export type InitDispatch = {
	type: 'init';
	data: CompositionData;
}

export type PriorityDispatch = {
	type: 'priority';
	priority: boolean;
}
