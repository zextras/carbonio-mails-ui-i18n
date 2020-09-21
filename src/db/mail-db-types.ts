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

export enum ParticipantType {
	FROM = 'f',
	TO = 't',
	CARBON_COPY = 'c',
	BLIND_CARBON_COPY = 'b',
	REPLY_TO = 'r',
	SENDER = 's',
	READ_RECEIPT_NOTIFICATION = 'n',
	RESENT_FROM = 'rf'
}

export type Participant = {
	type: ParticipantType;
	address: string;
	displayName: string;
};

export interface IMailMinimalData {
	/** Internal UUID */ _id?: string;
	/** Zimbra ID */ id?: string;
	parent: string;
}
