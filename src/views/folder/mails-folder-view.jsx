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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { VariableSizeList } from 'react-window';
import { Button, Container, Divider, Responsive, Row, SnackbarManager, Text, useScreenMode } from '@zextras/zapp-ui';
import { VerticalDivider } from '../../commons/vertical-divider';
import { useQueryParam } from '../../hooks/useQueryParam';
import ConversationEditPanel from '../edit/mail-edit-panel';
import ConversationPreviewPanel from '../preview/conversation-preview-panel';
import { selectConversationList, selectConversationStatus } from '../../store/conversations-slice';
import { selectFolders } from '../../store/folders-slice';
import { fetchConversations } from '../../store/actions';
import ConversationListItem from './conversation-list-item';

export function Breadcrumbs({ folderPath, itemsCount }) {
	return (
		<Container
			background="gray5"
			height={49}
			crossAlignment="flex-start"
		>
			<Row
				height="100%"
				width="100%"
				padding={{ vertical: 'medium', horizontal: 'large' }}
				mainAlignment="space-between"
			>
				<Row
					mainAlignment="flex-start"
					takeAvailableSpace
					padding={{ right: 'medium' }}
				>
					<Text size="large" data-testid="BreadcrumbPath">{ folderPath.split('/').join(' / ') }</Text>
				</Row>
				<Text size="medium" data-testid="BreadcrumbCount">{ itemsCount > 100 ? '100+' : itemsCount }</Text>
			</Row>
			<Divider />
		</Container>
	);
}

function LoadingIndicator({ style, index }) {
	return (
		<Container height={70} style={style} index={index}>
			<Button loading disabled label="" type="ghost" />
		</Container>
	);
}

const ConversationList = ({ folderId }) => {
	const dispatch = useDispatch();

	const containerRef = useRef();
	const listRef = useRef();

	const folder = useSelector(selectFolders)[folderId];
	const conversations = useSelector(selectConversationList) || [];

	const status = useSelector(selectConversationStatus);
	const hasMore = status === 'hasMore';
	const isLoading = status === 'pending';

	const loadMore = useCallback((date) => {
		const dateOrNull = date ? new Date(date) : null;
		dispatch(fetchConversations({ folderId, before: dateOrNull, limit: 50 }));
	}, [folderId, dispatch]);

	const [displayData, setDisplayData] = useState({});
	const [containerHeight, setContainerHeight] = useState(0);

	const updateDisplayData = useCallback(
		(index, id, v) => {
			listRef.current && listRef.current.resetAfterIndex(index);
			setDisplayData((oldData) => ({
				...oldData,
				[id]: v,
			}));
		},
		[listRef, setDisplayData],
	);

	const rowRenderer = useCallback(
		({ index, style }) => {
			const conversation = conversations[index];
			if (!conversation) return <LoadingIndicator style={style} index={index} />;
			return (
				<ConversationListItem
					style={style}
					index={index}
					conversation={conversation}
					folderId={folderId}
					displayData={displayData[conversation.id] || { open: false }}
					updateDisplayData={updateDisplayData}
				/>
			);
		},
		[conversations, displayData, folderId],
	);

	const calcItemSize = useCallback(
		(index) => {
			const conv = conversations[index];
			if (conv && displayData[conv.id] && displayData[conv.id].open && conv.messages.length > 1) {
				return (conv.messages.length + 1) * 70 - 1;
			}
			return 70;
		},
		[conversations, displayData],
	);

	useEffect(() => {
		if (listRef.current) listRef.current.resetAfterIndex(0, true);
	}, [conversations]);

	const onItemsRendered = useCallback(({ overscanStopIndex }) => {
		const conversationsLastIndex = conversations.length - 1;
		if (overscanStopIndex >= conversationsLastIndex && !isLoading && hasMore) {
			loadMore(conversations[conversationsLastIndex].date);
		}
	}, [conversations, hasMore, isLoading, loadMore]);

	useEffect(() => {
		if (typeof containerRef.current === 'undefined') return undefined;
		const onResize = () =>
			setContainerHeight(containerRef.current && containerRef.current.offsetHeight);
		onResize();
		window.top.addEventListener('resize', onResize);
		return () => window.top.removeEventListener('resize', onResize);
	}, []);

	return (
		<>
			{folder && <Breadcrumbs folderPath={folder.path} itemsCount={conversations.length} /> }
			<Row
				ref={containerRef}
				height="calc(100% - 49px)"
				orientation="vertical"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				takeAvailableSpace
				background="gray6"
				borderRadius="none"
			>
				<VariableSizeList
					ref={listRef}
					height={containerHeight}
					width="100%"
					itemCount={(isLoading ? 1 : 0) + conversations.length}
					overscanCount={15}
					style={{ outline: 'none' }}
					itemSize={calcItemSize}
					estimatedItemSize={57}
					onItemsRendered={onItemsRendered}
				>
					{ rowRenderer }
				</VariableSizeList>
			</Row>
		</>
	);
};

export default function FolderView() {
	const { folderId } = useParams();

	const dispatch = useDispatch();

	useEffect(() => {
		dispatch({
			type: 'conversations/setCurrentFolder',
			payload: folderId,
		});
	}, [folderId, dispatch]);

	useEffect(() => {
		if (folderId) dispatch(fetchConversations({ folderId, limit: 101 }));
	}, [folderId, dispatch]);

	const screen = useScreenMode();
	const conversationId = useQueryParam('conversation');
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
		if (conversationId) {
			return (
				<ConversationPreviewPanel key={`conversationPreview-${conversationId}`} />
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
	}, [editId, folderId, conversationId, screen]);

	return (
		<SnackbarManager>
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
				}}
			>
				<Responsive mode="desktop" target={window.top}>
					<Container
						width="calc(40% - 4px)"
						mainAlignment="flex-start"
						crossAlignment="unset"
						borderRadius="none"
					>
						<ConversationList
							key={`ConversationList-${folderId}`}
							folderId={folderId}
						/>
					</Container>
					<VerticalDivider />
					<Container
						width="calc(60% - 4px)"
						mainAlignment="flex-start"
						crossAlignment="flex-start"
						borderRadius="none"
						style={{ maxHeight: '100%' }}
					>
						{ MemoPanel }
					</Container>
				</Responsive>
				<Responsive mode="mobile" target={window.top}>
					<Container
						mainAlignment="flex-start"
						crossAlignment="flex-start"
						borderRadius="none"
						height="fill"
					>
						{ MemoPanel }
					</Container>
				</Responsive>
			</Container>
		</SnackbarManager>
	);
}
