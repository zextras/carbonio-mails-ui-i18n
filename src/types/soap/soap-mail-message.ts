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

import { SoapMailParticipant } from './soap-mail-participant';

export type SoapIncompleteMessage = {
	readonly id: string;
	/** Conversation id */ cid: string;
	/** Folder id */ l: string;
	/** Size */ s: number;
	/** Date */ d: number;
	// Flags. (u)nread, (f)lagged, has (a)ttachment, (r)eplied, (s)ent by me,
	// for(w)arded, calendar in(v)ite, (d)raft, IMAP-\Deleted (x), (n)otification sent,
	// urgent (!), low-priority (?), priority (+)
	/** Flags */ f?: string;
	/** TagNames */ tn?: string;
	/** Subject */ su?: string;
	/** Fragment */ fr?: string;
	/** Contacts */ e?: Array<SoapMailParticipant>;
	/** Parts */ mp?: Array<SoapMailMessagePart>;
}

export type SoapMailMessage = SoapIncompleteMessage & {
	/** Contacts */ e: Array<SoapMailParticipant>;
	/** Subject */ su: string;
	/** Fragment */ fr: string;
	/** Parts */ mp: Array<SoapMailMessagePart>;
	/** Flags */ f: string;
};

export type SoapMailMessagePart = {
	part?: string;
	/**	Content Type  */ ct: 'multipart/alternative' | string;
	/**	Size  */ s?: number;
	/**	Content id (for inline images)  */ ci?: string;
	/** Content disposition */ cd?: 'inline' | 'attachment';
	/**	Parts  */ mp?: Array<SoapMailMessagePart>;
	/**	Set if is the body of the message  */ body?: true;
	filename?: string;
	content?: string;
};
