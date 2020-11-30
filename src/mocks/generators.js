/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import faker from "faker";
import { forEach, uniq, map, flatMap, cloneDeep, keysIn, filter, valuesIn } from 'lodash';
// eslint-disable-next-line import/no-named-default
import {default as preloadedState} from "./states/folder-3-conversation-17736.json";
import { filterVisibleMessages, updateIncreasedConversation } from '../commons/update-conversation';

export function generateMessage({
	messageId = faker.random.number().toString(),
	conversationId = faker.random.number().toString(),
	folderId = '2',
	from = {
		email: faker.internet.email(),
		name: faker.name.findName(),
	},
	to = {
		email: faker.internet.email(),
		name: faker.name.findName(),
	},
	cc = [],
	subject = faker.lorem.sentence(),
	date = faker.time.recent(),
	content = faker.lorem.paragraph(5),
	isFlagged = faker.random.boolean(),
	isRead = faker.random.boolean(),
	isUrgent = faker.random.boolean(),
	isSentByMe = faker.random.boolean(),
	hasAttachments = faker.random.boolean(),
}) {
	const participants = [
		{
			"a": from.email,
			"d": faker.name.lastName(),
			"p": from.name,
			"t": "f"
		},
		{
			"a": to.email,
			"d": faker.name.lastName(),
			"p": to.name,
			"t": "t"
		},
	];
	const limit = faker.random.number(2);
	const newCc = cloneDeep(cc);
	for(let i=0; i< limit; i+=1)
		newCc.push({ name: faker.name.findName() });

	forEach(newCc,
		contact => {
			participants.push(
				{
					"a": contact.email || faker.internet.email(contact.name),
					"d": faker.name.lastName(),
					"p": contact.name,
					"t": "c"
				}
			)
		});

	return {
		"s": faker.random.number(),
		"d": date,
		"l": folderId,
		"cid": conversationId,
		"rev": faker.random.number(),
		"id": messageId,
		"fr": content.length > 50 ? `${content.substr(0, 50)}...` : content,
		"f": `${isFlagged ? 'f' : ''}${isRead ? '' : 'u'}${isSentByMe ? 's' : ''}${isUrgent ? '!' : ''}${hasAttachments ? 'a' : ''}`,
		"e": participants,
		"su": subject,
		"sd": faker.time.recent(),
		"mp": [{
			"part": "TEXT",
			"ct": "multipart/alternative",
			"mp": [
				{
					"part": "1",
					"ct": "text/plain",
					"s": 638
				}, {
					"part": "2",
					"ct": "text/html",
					"s": 6600,
					"body": true,
					"content": `<div><p>${content.split('\n').join('<br />')}</p></div>`
				}
			],
		}
		],
	};
}

export function generateConversation({
	me = {
		name: 'John Red',
		email: 'john.red@colors.com'
	},
	folderId = '3',
	conversationId = faker.random.number().toString(),
	messageIds = [],
	length = faker.random.number(5) + 1,
	subject = faker.lorem.sentence(),
	isRead = faker.random.boolean(),
	isFlagged = faker.random.boolean(),
	isUrgent = faker.random.boolean(),
	date = faker.time.recent(),
	hasAttachments = faker.random.boolean(),
}) {
	if(length < 1) throw new Error('`length` must be greater than 0');
	const messages = [];

	while(messageIds.length < length)
		messageIds.push(faker.random.number(50000).toString())

	forEach(
		messageIds,
		messageId => {
			const myRole = faker.random.number(2);

			messages.push(
				generateMessage({
					from: myRole === 0 ? me : undefined,
					to: myRole === 1 ? me : undefined,
					cc: myRole === 2 ? [me] : undefined,
					isFlagged: isFlagged ? undefined : false,
					isRead: isRead ? true : undefined,
					isUrgent: isUrgent ? undefined : false,
					hasAttachments: hasAttachments ? undefined : false,
					messageId,
					conversationId,
					date: faker.random.number(date),
					folderId: (2 + faker.random.number(3)).toString(),
				})
			);
		}
	);

	messages[0].d = date;
	messages[0].f = `${isFlagged ? 'f' : ''}${isRead ? '' : 'u'}${hasAttachments ? 'a' : ''}${isUrgent ? '!' : ''}`;
	messages[0].l = folderId;

	messages.sort((a, b) => b.d - a.d);
	messages[messages.length - 1].subject = subject;

	const participants = uniq(flatMap(messages, (m) => m.e));
	const flags = uniq(flatMap(messages, m => Array.from(m.f))).join('');

	return {
		"id": conversationId,
		"u": messages.filter(m => m.f.includes('u')).length,
		"n": messages.length,
		"f": flags,
		"d": date,
		"su": subject,
		"e": participants,
		"m": messages,
	};
}

export function generateState({
	messages = [],
	conversations = [],
	currentFolder = '3',
}) {
	const state = cloneDeep(preloadedState);
	state.conversations.currentFolder = currentFolder;

	messages.forEach(m => {
		preloadedState.messages.cache[m.id] = m;
		preloadedState.messages.status[m.id] = "complete";
	});

	 keysIn(preloadedState.folders.folders).forEach(key => {
	 	if(!preloadedState.conversations.cache[key]) {
			preloadedState.conversations.cache[key] = {
				"cache": {},
				"expandedStatus": {},
				"status": "empty"
			};
		}
	});

	conversations.forEach(c => {
		forEach(keysIn(state.cache), (folderId) => {
			const folder = state.cache[folderId];

			if (map(c.messages, (m) => m.parent).includes(folderId)) {
				const myConv = cloneDeep(c);

				myConv.messages = filterVisibleMessages(myConv.messages, folderId)
				updateIncreasedConversation(myConv, folderId);
				myConv.fragment = myConv.messages[0].fragment || '';

				state.conversations.cache[folderId].cache[myConv.id] = myConv;
				state.conversations.cache[folderId].expandedStatus[myConv.id] = 'complete';
			}
		});
	});

	return state;
}