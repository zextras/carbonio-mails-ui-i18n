import { MailMessage } from './mail-message';

export type MailsEditor = {
	id: string;
	draft: MailMessage;
	richText: boolean;
	text: string;
	html: string;
	to: Array<{ value: string; }>;
	bcc: Array<{ value: string; }>;
	cc: Array<{ value: string; }>;
}
