import { MailMessage } from './mail-message';
import { Participant } from './participant';

export type MailsEditor = {
	id: string;
	draft: MailMessage;
	richText: boolean;
	text: string;
	html: string;
	to: Array<{ value: string; }>;
	bcc: Array<{ value: string; }>;
	cc: Array<{ value: string; }>;
	from: Participant;
}
