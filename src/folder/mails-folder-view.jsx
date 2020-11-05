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
	useMemo,
	useRef,
	useState
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { VariableSizeList } from 'react-window';
import {
	Button,
	Container,
	Divider,
	Text,
	useScreenMode,
	Responsive,
	Row
} from '@zextras/zapp-ui';
import { VerticalDivider } from '../commons/vertical-divider';
import useQueryParam from '../hooks/useQueryParam';
import ConversationEditPanel from '../edit/mail-edit-panel';
import ConversationPreviewPanel from '../preview/conversation-preview-panel';
import ConversationListItem from './conversation-list-item';
import { useConvsInFolder, useFolder } from '../hooks';
import ConversationListProvider from '../context/conversation-list-provider';
import MessageListProvider from '../context/message-list-provider';
import FolderListProvider from '../context/folder-list-provider';
import { fetchConversations } from '../store/conversations-slice';

function Breadcrumbs({ folder, itemsCount }) {
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
					<Text size="large">{ folder && folder.path }</Text>
				</Row>
				<Text size="medium">{ itemsCount > 100 ? '100+' : itemsCount > 0 && itemsCount}</Text>
			</Row>
			<Divider />
		</Container>
	);
}

export default function FolderView() {
	const { folderId } = useParams();
	console.log('FOLDER-VIEW');

	const dispatch = useDispatch();

	useEffect(() => {
		if (folderId) dispatch(fetchConversations({ folderId }));
	}, [dispatch, folderId]);

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
				<ConversationPreviewPanel
					key={`conversationPreview-${conversationId}`}
					conversationInternalId={conversationId}
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
	}, [editId, folderId, conversationId, screen]);

	return (
		<FolderListProvider>
			<ConversationListProvider folderId={folderId}>
				<MessageListProvider>
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
				</MessageListProvider>
			</ConversationListProvider>
		</FolderListProvider>
	);
}

const LoadingIndicator = ({ style, index }) => (
	<Container height={70} style={style} index={index}>
		<Button loading disabled label="" type="ghost" />
	</Container>
);

const ConversationList = ({ folderId }) => {
	const containerRef = useRef();
	const listRef = useRef();
	const {
		conversations,
		folder,
		isLoading,
		hasMore,
		loadMore
	} = useConvsInFolder(folderId);

	const [displayData, setDisplayData] = useState({});
	const [containerHeight, setContainerHeight] = useState(0);
	const [lmConvsLength, setLmConvsLength] = useState(0);

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
			style
		}) => {
			if (!conversations[index]) return <LoadingIndicator style={style} index={index} />;
			if (!displayData[conversations[index].id]) {
				setDisplayData((oldData) => ({
					...oldData,
					[conversations[index].id]: { open: false }
				}));
			}
			return (
				<ConversationListItem
					style={style}
					index={index}
					conversation={conversations[index]}
					folderId={folderId}
					displayData={displayData[conversations[index].id] || { open: false }}
					updateDisplayData={updateDisplayData}
				/>
			);
		},
		[conversations, displayData, folderId, updateDisplayData]
	);

	const calcItemSize = useCallback(
		(index) => {
			const conv = conversations[index];
			if (conv && displayData[conv.id] && displayData[conv.id].open) {
				return (conv.msgCount + 1) * 70 - 1;
			}
			return 70;
		},
		[conversations, displayData]
	);

	useEffect(() => {
		if (listRef.current) listRef.current.resetAfterIndex(0, true);
	}, [conversations]);

	const onItemsRendered = useCallback(({ overscanStopIndex }) => {
		const conversationsLastIndex = conversations.length - 1;
		if (!isLoading && lmConvsLength !== conversationsLastIndex
			&& hasMore && loadMore && overscanStopIndex >= conversationsLastIndex) {
			setLmConvsLength(conversationsLastIndex);
			loadMore(conversations[conversationsLastIndex]);
		}
	}, [conversations, hasMore, loadMore, isLoading, lmConvsLength]);

	useEffect(() => {
		!isLoading && hasMore && loadMore && conversations.length < 20 && loadMore();
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
			{ folder && <Breadcrumbs folder={folder} itemsCount={conversations.length} /> }
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
				{ (isLoading || (conversations && conversations.length > 0)) && (
					<VariableSizeList
						ref={listRef}
						height={containerHeight}
						width="100%"
						itemCount={(isLoading ? 1 : 0) + (conversations || []).length}
						overscanCount={15}
						style={{ outline: 'none' }}
						itemSize={calcItemSize}
						estimatedItemSize={57}
						onItemsRendered={onItemsRendered}
					>
						{rowRenderer}
					</VariableSizeList>
				)}
			</Row>
		</>
	);
};
