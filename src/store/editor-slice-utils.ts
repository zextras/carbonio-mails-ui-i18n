import { find } from 'lodash';
import { Account } from '@zextras/zapp-shell';
import { MailsEditor } from '../types/mails-editor';
import { MailMessage, MailMessagePart } from '../types/mail-message';
import { ParticipantRole } from '../types/participant';

export const emptyEditor = (id: string, accounts: Array<Account>): MailsEditor => ({
	richText: false,
	text: '',
	html: '',
	to: [],
	cc: [],
	bcc: [],
	from: {
		type: ParticipantRole.FROM,
		address: accounts[0].name,
		name: accounts[0].name,
		fullName: accounts[0].displayName
	},
	id,
	draft: {
		id: 'new',
		parent: '6',
		conversation: '',
		participants: [],
		date: Date.now(),
		read: true,
		subject: '',
		fragment: '',
		size: 0,
		attachment: false,
		flagged: false,
		urgent: false,
		parts: [],
		bodyPath: '',
		tags: []
	}
});

export function isHtml(parts: Array<MailMessagePart>): boolean {
	function subtreeContainsHtmlParts(part: MailMessagePart): boolean {
		if (part.contentType === 'text/html') return true;
		return part.parts ? part.parts.some(subtreeContainsHtmlParts) : false;
	}
	return parts.some(subtreeContainsHtmlParts);
}

export function recursiveFindText(parts: Array<MailMessagePart>): MailMessagePart | undefined {
	function findText(part: MailMessagePart): MailMessagePart | undefined {
		if (part.contentType === 'text/plain') return part;
		return part.parts && recursiveFindText(part.parts);
	}
	return parts.find(findText);
}

export const extractBody = (draft: MailMessage): { text: string; html: string } => {
	const text = recursiveFindText(draft.parts);
	const html = find(draft.parts, ['contentType', 'multipart/alternative']);
	const htmlText = html ? find(html.parts, ['contentType', 'text/html']) : '';
	return {
		text: (text && text.content) ? text.content : '',
		html: (htmlText && htmlText.content) ? htmlText.content : ''
	};
};
