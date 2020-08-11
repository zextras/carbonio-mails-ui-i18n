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
import { MailMessagePart } from '../../idb/IMailsIdb';

export type CompositionData = {
	to: CompositionParticipants;
	cc: CompositionParticipants;
	bcc: CompositionParticipants;
	subject: string;
	body: {
		text: string;
		html: string;
	};
	html: boolean;
	priority: boolean;
	attachments: Array<MailMessagePart>;
}

export type CompositionAttachment = {
	aid: string;
}

export type CompositionParticipants = Array<{ value: string }>;

export type CompositionDataWithFn = CompositionData & {
	onFileLoad: (ev: ChangeEvent, files: FileList) => void;
	onSend: () => void;
	onParticipantChange: (field: 'to' | 'cc' | 'bcc', value: CompositionParticipants) => void;
	onModeChange: (mode: boolean) => void;
	onPriorityChange: (priority: boolean) => void;
	onEditorChange: (text: string, html: string) => void;
	onSubjectChange: (value: string) => void;
	onRemoveAttachment: (name: string) => void;
}

export type DispatchAction =
	ResetDispatch
	| UpdateDispatch
	| InitDispatch
	| PriorityDispatch
	| EditorDispatch
	| ModeDispatch
	| AttachmentDispatch
	| RemoveAttachmentDispatch

export type RemoveAttachmentDispatch = {
	type: 'remove-attachment';
	name: string;
}

export type AttachmentDispatch = {
	type: 'attachments-saved';
	attachments: Array<MailMessagePart>;
}

export type EditorDispatch = {
	type: 'editor-change';
	text: string;
	html: string;
}

export type ResetDispatch = {
	type: 'reset';
	newState?: CompositionData;
}

export type UpdateDispatch = {
	type: 'update';
	field: 'to' | 'cc' | 'bcc' | 'subject';
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

export type ModeDispatch = {
	type: 'switch-mode';
	htmlMode: boolean;
}
