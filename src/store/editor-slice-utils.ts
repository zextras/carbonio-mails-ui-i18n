import { dropRight, find, join, map, set, split } from 'lodash';
import { Account } from '@zextras/zapp-shell';
import { MailsEditor } from '../types/mails-editor';
import { MailMessage, MailMessagePart } from '../types/mail-message';
import { Participant, ParticipantRole } from '../types/participant';
import { SoapDraftMessageObj, SoapEmailMessagePartObj } from '../types/soap';


export const generateRequest = (editor: MailsEditor): SoapDraftMessageObj => ({
	id: editor.draft.id === 'new' ? undefined : editor.draft.id,
	su: { _content: editor.draft.subject ?? '' },
	e: map(
		[
			editor.from,
			...editor.to,
			...editor.cc,
			...editor.bcc
		],
		(c) => ({
			t: c.type,
			a: c.address,
			d: (c as unknown as Participant).fullName
				?? (c as unknown as Participant).name
				?? undefined
		})
	),
	// e: map(editor.draft.participants ?? [], (p) => ({
	// 	t: p.type,
	// 	a: p.address,
	// 	d: p.fullName
	// 		?? p.name
	// 		?? undefined
	// })),
	mp: ((): SoapEmailMessagePartObj[] => {
		const part = (editor.richText ? {
			ct: 'multipart/alternative',
			mp: [
				{
					ct: 'text/html',
					content: { _content: editor.html }
				},
				{
					ct: 'text/plain',
					content: { _content: editor.text }
				}
			]
		} : {
			ct: 'text/plain',
			body: true,
			content: { _content: editor.text }
		}) as SoapEmailMessagePartObj;
		if (editor.draft.id !== 'new' && editor.draft.bodyPath !== '') {
			return set<SoapEmailMessagePartObj[]>(editor.draft.parts, join(dropRight(split(editor.draft.bodyPath, '.')), '.'), part);
		}
		return [part];
	})()
});


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
		tags: [],
		isDeleted: false,
		isDraft: true,
		isInvite: false,
		isSentByMe: true,
		isForwarded: false
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
