import { MailMessage } from './mail-message';
import { Participant } from './participant';

export type DraftMailMessage = MailMessage & { participants: Participant[]; subject: string; }

export type MailsEditor = {
	id: string;
	draft: DraftMailMessage;
	richText: boolean;
	text: string;
	html: string;
	to: Array<Participant>;
	bcc: Array<Participant>;
	cc: Array<Participant>;
	from: Participant;
}
