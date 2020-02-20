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


import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { Container, ListHeader, List, Text } from '@zextras/zapp-ui';
import { findIndex, map, reduce, filter, forEach } from 'lodash';
import ConversationListItem from './ConversationListItem';
import mailContext from '../../context/MailContext';

export default function MailList() {
	const { conversations, mails } = useContext(mailContext);
	return (
		<Container
			orientation="vertical"
			width="fill"
			height="fill"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
		>
			<Container
				orientation="vertical"
				width="fill"
				background="bg_9"
				style={{
					minHeight: '40px'
				}}
			>
				{conversations && conversations.length > 0
				&&
					<List
						Factory={conversationsFactory(conversations, mails)}
						amount={conversations.length}
					/>
				}
			</Container>
		</Container>
	);
};

const conversationsFactory = (conversations, mails) => ({ index }) => (
	<ConversationListItem
		conversation={conversations[index]}
		mails={map(conversations[index].messages, mailInfo => mails[mailInfo.id])}
		selected={false}
		selectable={false}
		onSelect={console.log}
		onDeselect={console.log}
	/>
);
