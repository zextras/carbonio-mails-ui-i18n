import { MailMessageFromSoap } from "src/db/mail-message";

export type MailsEditor {
	id: string;
	draft: MailMessageFromSoap;
	richText: boolean;
	text: string;
	html: string;
	to: Array<{ value: string; }>;
	bcc: Array<{ value: string; }>;
	cc: Array<{ value: string; }>;
}
