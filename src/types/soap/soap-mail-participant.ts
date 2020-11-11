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

export type SoapEmailParticipantRole = 'f' | 't' | 'c' | 'b' | 'r' | 's' | 'n' | 'rf';

export interface SoapMailParticipant {
	/** Address */
	a: string;
	/** Display name */
	d?: string;
	/** Type:
	 * (f)rom,
	 * (t)o,
	 * (c)c,
	 * (b)cc,
	 * (r)eply-to,
	 * (s)ender,
	 * read-receipt (n)otification,
	 * (rf) resent-from
	 */
	p: string;
	t: SoapEmailParticipantRole;
	isGroup?: 0 | 1;
};
