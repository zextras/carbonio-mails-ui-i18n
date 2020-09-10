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

import { fetchConversationsInFolder, fetchMailMessagesById } from './soap';
import { MailsFolder } from './db/mails-folder';
import { MailConversation } from './db/mail-conversation';
import { MailMessageFromSoap } from './db/mail-message';
import { MailConversationMessage } from './db/mail-conversation-message';

describe('SOAP', () => {
	test('Fetch Conversations in Folder', (done) => {
		const fetch = jest.fn()
			.mockImplementationOnce(() => Promise.resolve({
				json: () => Promise.resolve({
					Body: {
						SearchResponse: {
							c: [{
								id: '-1000',
								d: 0,
								n: 2,
								u: 1,
								m: [{
									id: '1000',
									l: '2'
								}, {
									id: '1001',
									l: '5'
								}],
								e: [
									{ t: 'f', a: 'from@example.com', d: 'From' },
									{ t: 't', a: 'to@example.com', d: 'To' },
									{ t: 'b', a: 'bcc@example.com', d: 'Bcc' },
									{ t: 'c', a: 'cc@example.com', d: 'Cc' },
									{ t: 'r', a: 'reply-to@example.com', d: 'Reply-To' },
									{ t: 's', a: 'sender@example.com', d: 'Sender' },
									{ t: 'n', a: 'notification@example.com', d: 'Notification' },
									{ t: 'rf', a: 'resent-from@example.com', d: 'Resent-From' }
								],
								su: 'Conversation Subject',
								fr: 'Conversation Fragment',
								f: 'u'
							}]
						}
					}
				})
			}))
			.mockImplementationOnce(() => Promise.resolve({
				json: () => Promise.resolve({
					Body: {
						BatchResponse: {
							GetMsgResponse: [
								{
									m: [
										{
											id: '1000'
										}
									]
								},
								{
									m: [
										{
											id: '1001'
										}
									]
								}
							]
						}
					}
				})
			}));

		fetchConversationsInFolder(
			fetch,
			new MailsFolder({
				path: '/Inbox'
			})
		)
			.then(([convs, convsMessages, hasMore]) => {
				expect(convs.length).toBe(1);
				const conv = convs[0];
				expect(conv).toBeInstanceOf(MailConversation);
				expect(conv.id).toBe('-1000');
				expect(conv.messages).toStrictEqual([
					new MailConversationMessage({ id: '1000', parent: '2' }),
					new MailConversationMessage({ id: '1001', parent: '5' })
				]);
				expect(conv.parent).toStrictEqual(['2', '5']);
				expect(conv.subject).toBe('Conversation Subject');
				expect(conv.fragment).toBe('Conversation Fragment');
				expect(conv.read).toBe(false);
				expect(conv.attachment).toBe(false);
				expect(conv.flagged).toBe(false);
				expect(conv.urgent).toBe(false);
				expect(conv.participants).toStrictEqual([
					{ address: 'from@example.com', displayName: 'From', type: 'f' },
					{ address: 'to@example.com', displayName: 'To', type: 't' },
					{ address: 'bcc@example.com', displayName: 'Bcc', type: 'b' },
					{ address: 'cc@example.com', displayName: 'Cc', type: 'c' },
					{ address: 'reply-to@example.com', displayName: 'Reply-To', type: 'r' },
					{ address: 'sender@example.com', displayName: 'Sender', type: 's' },
					{ address: 'notification@example.com', displayName: 'Notification', type: 'n' },
					{ address: 'resent-from@example.com', displayName: 'Resent-From', type: 'rf' }
				]);
				expect(conv.urgent).toBe(false);
				expect(convsMessages[0]).toBeInstanceOf(MailMessageFromSoap);
				expect(convsMessages[1]).toBeInstanceOf(MailMessageFromSoap);
				done();
			})
			.catch(done);
	});

	test('Fetch Conversations in Folder, Error on ParticipantType', (done) => {
		const fetch = jest.fn().mockImplementation(() => Promise.resolve({
			c: [{
				id: '-1000',
				d: 0,
				n: 2,
				u: 1,
				m: [{
					id: '1000',
					l: '2'
				}, {
					id: '1001',
					l: '5'
				}],
				e: [
					{ t: 'xx', a: 'unknown@example.com', d: 'Unkown' },
				],
				su: 'Conversation Subject',
				fr: 'Conversation Fragment',
				f: 'u'
			}]
		}));
		fetchConversationsInFolder(
			fetch,
			new MailsFolder({
				path: '/Inbox'
			})
		)
			.then((convs) => {
				done(new Error('Conversations should not be parsed'));
			})
			.catch((e) => {
				expect(e).toBeInstanceOf(Error);
				done();
			});
	});
});
