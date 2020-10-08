import { CompositionState, emptyDraft, extractBody } from './use-composition-data';
import { MailsDb } from '../db/mails-db';
import { MailMessagePart, ParticipantType } from '../db/mail-message';
import {accounts} from '@zextras/zapp-shell';

export default function handleSaveDraft(db: MailsDb, id: string, cData: CompositionState, action: string, actionId: string) {
	const draftResponse: CompositionState = { ...emptyDraft };
	if (action) {
		if (action === 'editAsNew') {
			return db.messages.where({ id: actionId }).first().then((message) => {
				if (message) {
					draftResponse.subject = message.subject;
					const body = extractBody(message);
					draftResponse.richText = message.parts.filter((part) => part.contentType !== 'text/plain').length !== 0;

					draftResponse.body.text = body.text;
					draftResponse.body.html = body.html;
					return db.saveDraftFromAction(draftResponse, message.conversation);
				}
			});
		}
		return db.messages.where({ id: actionId }).first().then((message) => {
			if (message) {
				if (action === 'reply' || action === 'replyAll') {
					let to = message.contacts.filter((m) => m.type === ParticipantType.REPLY_TO);
					if (to.length < 1) {
						to = message.contacts.filter((m) => m.type === ParticipantType.FROM);
					}
					draftResponse.to = to.map((m) => ({ value: m.address }));
					if (message.subject.startsWith('Re:')) draftResponse.subject = `${message.subject}`;
					else	draftResponse.subject = `Re: ${message.subject}`;
				}

				if (action === 'replyAll') {
					draftResponse.cc = message.contacts
						.filter((m) => (m.type === ParticipantType.CARBON_COPY || m.type === ParticipantType.TO))
						.filter((m) => !(m.address in accounts.map((a) => a.name)))
						.map((m) => ({ value: m.address }));
				}

				if (action === 'forward') {
					draftResponse.subject = `Fwd: ${message.subject}`;
					// TODO: attachments
				}

				draftResponse.richText = message.parts.filter((part) => part.contentType !== 'text/plain').length !== 0;

				const body = extractBody(message);

				const from = message.contacts
					.filter((m) => m.type === ParticipantType.FROM)
					.map((c) => `"${c.displayName}" <${c.address}>`)
					.join(', ');

				const to = message.contacts
					.filter((m) => m.type === ParticipantType.TO)
					.map((c) => `"${c.displayName}" <${c.address}>`)
					.join(', ');

				const cc = message.contacts
					.filter((m) => m.type === ParticipantType.CARBON_COPY)
					.map((c) => `"${c.displayName}" <${c.address}>`)
					.join(', ');


				const options = {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric'
				};
				const date = new Date(message.date);
				const printDate = date.toLocaleString(undefined, options);


				let bodyHtml = `<br /><br /><hr><b>From:</b> ${from} <br /> <b>To:</b> ${to} <br />`;
				let bodyText = `\n\n---------------------------\nFrom: ${from}\nTo: ${to}\n`;

				if (cc.length > 0) {
					bodyHtml = bodyHtml.concat(`<b>Cc:</b> ${cc}<br />`);
					bodyText = bodyText.concat(`Cc: ${cc}\n`);
				}

				draftResponse.body.html = bodyHtml.concat(`<b>Sent:</b> ${printDate} <br /> <b>Object:</b> ${message.subject} <br /><br />${body.html}`);
				draftResponse.body.text = bodyText.concat(`Sent: ${printDate}\nObject: ${message.subject}\n\n${body.text}`);

				return db.saveDraftFromAction(draftResponse, message.conversation);
			}
		});
	}
	else {
		return db.saveDraft(id, cData);
	}
}