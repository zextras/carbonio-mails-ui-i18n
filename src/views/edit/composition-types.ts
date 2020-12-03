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

import { MailsEditor } from '../../types/mails-editor';
import { Participant } from '../../types/participant';

export type CompositionData = {
	compositionData: MailsEditor;
	actions: {
		updateSubjectCb: (value: string) => void;
		updateContactsToCb: (value: Array<Participant>) => void;
		updateContactsCcCb: (value: Array<Participant>) => void;
		updateContactsBccCb: (value: Array<Participant>) => void;
		updateBodyCb: (value: [string, string]) => void;
		toggleRichTextCb: (richText: boolean) => void;
		toggleFlaggedCb: (flagged: boolean) => void;
		toggleUrgentCb: (urgent: boolean) => void;
		sendMailCb: () => void;
		saveDraftCb: () => void;
	};
};
