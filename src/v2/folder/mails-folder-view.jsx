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

function Breadcrumbs({ folder }) {
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
				<Text size="large">{ folder && folder.path }</Text>
			</Row>
			<Divider />
		</Container>
	);
}

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

const ConversationList = ({ folderId }) => {

	const containerRef = useRef();
	const listRef = useRef();
	const {
		conversations,
		hasMore,
		loading,
		folder
	} = useConversationsInFolder(folderId);

	const [displayData, setDisplayData] = useState({});

	const updateDisplayData = useCallback(
		(index, id, v) => {
			listRef.current && listRef.current.resetAfterIndex(index);
			setDisplayData((oldData) => ({
				...oldData,
				[id]: v
			}));
		},
		[]
	);

	const rowRenderer = useCallback(
		({
			index,
			key,
			style
		}) => {
			if (!displayData[conversations[index].id]) {
				setDisplayData((oldData) => ({
					...oldData,
					[conversations[index].id]: { open: false }
				}));
			}
			return (
				<ConversationListItem
					key={key}
					style={style}
					index={index}
					conversation={conversations[index]}
					displayData={displayData[conversations[index].id] || { open: false }}
					updateDisplayData={updateDisplayData}
				/>
			);
		},
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

	if (loading) {
		return <Text> LOADING </Text>;
	}

	return (
		<>
			{ folder && <Breadcrumbs folder={folder} /> }
			<Container
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				borderRadius="none"
				ref={containerRef}
			>
				{ conversations && conversations.length > 0 && (
					<VariableSizeList
						ref={listRef}
						height={(containerRef.current && containerRef.current.offsetHeight) || 0}
						width="100%"
						itemCount={(conversations || []).length}
						overscanRowCount={15}
						rowRenderer={rowRenderer}
						style={{ outline: 'none' }}
						itemSize={calcItemSize}
						estimatedItemSize={57}
					>
						{rowRenderer}
					</VariableSizeList>
				)}
			</Container>
		</>
	);
};
