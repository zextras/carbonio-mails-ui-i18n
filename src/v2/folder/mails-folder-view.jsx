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

import React, {
	useCallback,
	useEffect,
	useMemo, useRef,
	useState
} from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { hooks } from '@zextras/zapp-shell';
import { VariableSizeList } from 'react-window';
import {
	Container,
	Divider,
	Text,
	useScreenMode,
	Responsive,
	Row
} from '@zextras/zapp-ui';
import { reduce } from 'lodash';
import { VerticalDivider } from '../commons/vertical-divider';
import useQueryParam from '../hooks/useQueryParam';
import ConversationEditPanel from '../edit/conversation-edit-panel';
import ConversationPreviewPanel from '../preview/conversation-preview-panel';
import ConversationListItem from './conversation-list-item';
import { useConversationsInFolder } from '../hooks';

function Breadcrumbs({ folderId }) {
	const { db } = hooks.useAppContext();
	const query = useMemo(
		() => () => db.folders.where({ _id: folderId }).toArray()
			.then((folders) => Promise.resolve(folders[0])),
		[db, folderId]
	);
	// TODO: Add the sort by
	const [folder, folderLoaded] = hooks.useObserveDb(query, db);

	return (
		<Container
			background="gray5"
			height={49}
			crossAlignment="flex-start"
		>
			<Row
				height={48}
				padding={{ all: 'medium' }}
			>
				<Text size="large">{ folderLoaded && folder && folder.path }</Text>
			</Row>
			<Divider />
		</Container>
	);
}
Breadcrumbs.propTypes = {
	folderId: PropTypes.string.isRequired
};

export default function FolderView() {
	const { folderId } = useParams();

	const screen = useScreenMode();
	const previewId = useQueryParam('preview');
	const editId = useQueryParam('edit');
	const MemoPanel = useMemo(() => {
		if (editId) {
			return (
				<ConversationEditPanel
					key={`conversationEdit-${editId}`}
					editPanelId={editId}
					folderId={folderId}
				/>
			);
		}
		if (previewId) {
			return (
				<ConversationPreviewPanel
					key={`conversationPreview-${previewId}`}
					coversationInternalId={previewId}
					folderId={folderId}
				/>
			);
		}
		if (screen === 'mobile') {
			return (
				<ConversationList
					key={`ConversationList-${folderId}`}
					folderId={folderId}
				/>
			);
		}
		return <Container />;
	}, [editId, folderId, previewId, screen]);

	return (
		<Container
			orientation="row"
			crossAlignment="flex-start"
			mainAlignment="flex-start"
			width="fill"
			height="fill"
			background="gray5"
			borderRadius="none"
			style={{
				maxHeight: '100%',
				overflowY: 'auto'
			}}
		>
			<Responsive mode="desktop" target={window.top}>
				<Container
					width="calc(50% - 4px)"
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					borderRadius="none"
				>
					<ConversationList
						key={`ConversationList-${folderId}`}
						folderId={folderId}
					/>
				</Container>
				<VerticalDivider />
				<Container
					width="calc(50% - 4px)"
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					borderRadius="none"
				>
					{MemoPanel}
				</Container>
			</Responsive>
			<Responsive mode="mobile" target={window.top}>
				<Container
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					borderRadius="none"
					height="fill"
				>
					{MemoPanel}
				</Container>
			</Responsive>
		</Container>
	);
}

const useDisplayData = (conversations) => {
	const [displayData, setDisplayData] = useState(
		reduce(
			conversations,
			(acc, c) => ({
				...acc,
				[c.id]: {
					open: false
				}
			}),
			{}
		)
	);
	useEffect(
		() => {
			setDisplayData((oldDisplayData) => reduce(
				conversations,
				(acc, c) => (acc[c.id]
					? acc
					: ({
						...acc,
						[c.id]: {
							open: false
						}
					})),
				oldDisplayData
			));
		},
		[conversations]
	);
	const updateDisplayData = useCallback(
		(id, value) => {
			setDisplayData(
				{
					...displayData,
					[id]: {
						...displayData[id],
						...value
					}
				}
			);
		},
		[displayData]
	);
	return [displayData, updateDisplayData];
};

const ConversationList = ({ folderId }) => {

	const containerRef = useRef();
	const listRef = useRef();
	const {
		conversations,
		hasMore,
		loading,
		folder
	} = useConversationsInFolder(folderId);

	// const [conversations, conversationsLoaded] = useMemo(() => {
	// 	const arr = new Array(150);
	// 	return [map(arr, () => ({
	// 		id: Math.random() * 200,
	// 		_id: '_id',
	// 		parent: [folderId],
	// 		date: Math.floor(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365),
	// 		msgCount: Math.floor(Math.random() * 5),
	// 		unreadMsgCount: Math.floor(Math.random() * 5),
	// 		messages: [],
	// 		participants: [
	// 			{
	// 				type: 'f',
	// 				address: 'adderss1@boh.com',
	// 				displayName: 'participant 0 sender'
	// 			},
	// 			{
	// 				type: 't',
	// 				address: 'address2@boh.com',
	// 				displayName: 'recipient'
	// 			},
	// 			{
	// 				type: 'c',
	// 				address: 'address3@boh.com',
	// 				displayName: 'participant 1 cc'
	// 			}
	// 		],
	// 		subject: 'subject',
	// 		fragment: 'fragment',
	// 		read: Math.random() > 0.5,
	// 		attachment: Math.random() > 0.5,
	// 		flagged: Math.random() > 0.5,
	// 		urgent: Math.random() > 0.5,
	// 	})), true];
	// }, [folderId]);
	const [displayData, updateDisplayData] = useDisplayData(conversations, listRef);

	const rowRenderer = useCallback(
		({
			index,
			key,
			style
		}) => (
			<ConversationListItem
				key={key}
				style={style}
				conversation={conversations[index]}
				displayData={displayData[conversations[index].id]}
				updateDisplayData={(id, v) => {
					listRef.current && listRef.current.resetAfterIndex(index);
					updateDisplayData(id, v);
				}}
			/>
		),
		[conversations, displayData, updateDisplayData]
	);

	const calcItemSize = useCallback(
		(index) => {
			const conv = conversations[index];
			if (displayData[conv.id] && displayData[conv.id].open) return (conv.msgCount + 1) * 57;
			return 57;
		},
		[conversations, displayData]
	);

	if (conversations && displayData) {
		return (
			<>
				<Breadcrumbs folderId={folderId} />
				<Container
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					borderRadius="none"
					ref={containerRef}
				>
					<VariableSizeList
						ref={listRef}
						height={(containerRef.current && containerRef.current.offsetHeight) || 0}
						width="100%"
						itemCount={(conversations || []).length}
						overscanRowCount={10}
						rowRenderer={rowRenderer}
						style={{ outline: 'none' }}
						itemSize={calcItemSize}
						estimatedItemSize={57}
					>
						{rowRenderer}
					</VariableSizeList>
				</Container>
			</>
		);
	}
	return (
		<Container />
	);
};
