import { ParticipantRole } from '../participant';

export type SoapEmailMessagePartObj = {
	part?: string;
	/**	Content Type  */ ct: 'multipart/alternative' | string;
	/**	Size  */ s?: number;
	/**	Content id (for inline images)  */ ci?: string;
	/** Content disposition */ cd?: 'inline' | 'attachment';
	/**	Parts  */ mp?: Array<SoapEmailMessagePartObj>;
	/**	Set if is the body of the message  */ body?: true;
	filename?: string;
	content?: { _content: string };
};

export type SoapEmailInfoObj = {
	/** Address */
	a: string;
	/** Display name */
	d?: string;
	t: ParticipantRole;
	isGroup?: 0|1;
};

export type SoapDraftMessageObj = {
	id?: string;
	su: { _content: string };
	mp: Array<SoapEmailMessagePartObj>;
	e: Array<SoapEmailInfoObj>;
	f?: string;
	did?: string;
};

export type SaveDraftRequest = {
	m: SoapDraftMessageObj;
}

export type SaveDraftResponse = {
	m: Array<{
		mp: Array<SoapEmailMessagePartObj>;
		id: string;
		cid: string;
		d: number;
	}>;
}
