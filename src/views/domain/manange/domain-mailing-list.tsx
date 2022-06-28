/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
	Container,
	Row,
	IconButton,
	Divider,
	Button,
	Padding,
	Icon,
	Input,
	Table,
	Text,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { Trans, useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import logo from '../../../assets/gardian.svg';
import Paginig from '../../components/paging';
import { searchDirectory } from '../../../services/search-directory-service';
import EditMailingListView from './edit-mailing-detail-view';
import { useDomainStore } from '../../../store/domain/store';
import { RECORD_DISPLAY_LIMIT } from '../../../constants';

const DomainMailingList: FC = () => {
	const [t] = useTranslation();
	const createSnackbar: any = useContext(SnackbarManagerContext);
	const domainName = useDomainStore((state) => state.domain?.name);
	const [mailingList, setMailingList] = useState<any[]>([]);
	const [offset, setOffset] = useState<number>(0);
	const [limit, setLimit] = useState<number>(RECORD_DISPLAY_LIMIT);
	const [totalAccount, setTotalAccount] = useState<number>(0);
	const [selectedMailingList, setSelectedMailingList] = useState<any>({});
	const [showMailingListDetailView, setShowMailingListDetailView] = useState<any>();
	const [searchString, setSearchString] = useState<string>('');
	const [searchQuery, setSearchQuery] = useState<string>('');
	const headers: any[] = useMemo(
		() => [
			{
				id: 'name',
				label: t('label.name', 'Name'),
				width: '20%',
				bold: true
			},
			{
				id: 'address',
				label: t('label.address', 'Address'),
				width: '20%',
				bold: true
			},
			{
				id: 'members',
				label: t('label.members', 'Members'),
				width: '15%',
				bold: true
			},
			{
				id: 'status',
				label: t('label.status', 'Status'),
				width: '15%',
				bold: true
			},
			{
				id: 'gal',
				label: t('label.gal', 'GAL'),
				width: '15%',
				bold: true
			},
			{
				id: 'description',
				label: t('label.description', 'Description'),
				width: '15%',
				bold: true
			}
		],
		[t]
	);

	const getMailingList = useCallback((): void => {
		const attrs =
			'displayName,zimbraId,zimbraMailHost,uid,description,zimbraIsAdminGroup,zimbraMailStatus,zimbraIsDelegatedAdminAccount,zimbraIsAdminAccount,zimbraIsSystemResource,zimbraIsSystemAccount,zimbraIsExternalVirtualAccount';
		const types = 'distributionlists,dynamicgroups';
		const query = `${searchQuery}(&(!(zimbraIsSystemAccount=TRUE)))`;

		searchDirectory(attrs, types, domainName || '', query, offset, limit, 'name')
			.then((response) => response.json())
			.then((data) => {
				const dlList = data?.Body?.SearchDirectoryResponse?.dl;
				if (dlList) {
					if (data?.Body?.SearchDirectoryResponse?.searchTotal) {
						setTotalAccount(data?.Body?.SearchDirectoryResponse?.searchTotal);
					}
					const mList: any[] = [];
					dlList.forEach((item: any, index: number) => {
						mList.push({
							id: item?.id,
							columns: [
								<Text
									size="small"
									weight="light"
									key={item?.id}
									color="gray0"
									onClick={(event: { stopPropagation: () => void }): void => {
										event.stopPropagation();
										setSelectedMailingList(item);
										setShowMailingListDetailView(true);
									}}
								>
									{item?.a?.find((a: any) => a?.n === 'displayName')?._content}
								</Text>,
								<Text
									size="medium"
									weight="light"
									key={item?.id}
									color="gray0"
									onClick={(event: { stopPropagation: () => void }): void => {
										event.stopPropagation();
										setSelectedMailingList(item);
										setShowMailingListDetailView(true);
									}}
								>
									{item?.name}
								</Text>,
								<Text
									size="medium"
									weight="light"
									key={item?.id}
									color="gray0"
									onClick={(event: { stopPropagation: () => void }): void => {
										event.stopPropagation();
										setSelectedMailingList(item);
										setShowMailingListDetailView(true);
									}}
								>
									{''}
								</Text>,
								<Text
									size="medium"
									weight="light"
									key={item?.id}
									color="gray0"
									onClick={(event: { stopPropagation: () => void }): void => {
										event.stopPropagation();
										setSelectedMailingList(item);
										setShowMailingListDetailView(true);
									}}
								>
									{item?.a?.find((a: any) => a?.n === 'zimbraMailStatus')?._content === 'enabled'
										? t('label.can_receive', 'Can receive')
										: ''}
								</Text>,
								<Text
									size="medium"
									weight="light"
									key={item?.id}
									color="gray0"
									onClick={(event: { stopPropagation: () => void }): void => {
										event.stopPropagation();
										setSelectedMailingList(item);
										setShowMailingListDetailView(true);
									}}
								>
									{''}
								</Text>,
								<Text
									size="medium"
									weight="light"
									key={item?.id}
									color="gray0"
									onClick={(event: { stopPropagation: () => void }): void => {
										event.stopPropagation();
										setSelectedMailingList(item);
										setShowMailingListDetailView(true);
									}}
								>
									{item?.a?.find((a: any) => a?.n === 'description')?._content}
								</Text>
							]
						});
					});
					setMailingList(mList);
				} else {
					setTotalAccount(0);
					setMailingList([]);
				}
			});
	}, [t, offset, limit, domainName, searchQuery]);

	useEffect(() => {
		getMailingList();
	}, [offset, getMailingList]);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const searchMailingListQuery = useCallback(
		debounce((searchText) => {
			if (searchText) {
				setOffset(0);
				setSearchQuery(
					`(|(mail=*${searchText}*)(cn=*${searchText}*)(sn=*${searchText}*)(gn=*${searchText}*)(displayName=*${searchText}*)(zimbraMailDeliveryAddress=*${searchText}*))`
				);
			} else {
				setOffset(0);
				setSearchQuery('');
			}
		}, 100),
		[debounce]
	);

	useEffect(() => {
		searchMailingListQuery(searchString);
	}, [searchString, searchMailingListQuery]);

	useEffect(() => {
		if (showMailingListDetailView !== undefined && !showMailingListDetailView) {
			getMailingList();
		}
	}, [showMailingListDetailView, getMailingList]);

	return (
		<Container padding={{ all: 'large' }} mainAlignment="flex-start" background="gray6">
			<Row takeAvwidth="fill" mainAlignment="flex-start" width="100%">
				<Container
					orientation="vertical"
					mainAlignment="space-around"
					background="gray6"
					height="58px"
				>
					<Row orientation="horizontal" width="100%" padding={{ all: 'large' }}>
						<Row mainAlignment="flex-start" width="30%" crossAlignment="flex-start">
							<Text size="medium" weight="bold" color="gray0">
								{t('label.mailing_list', 'Mailing List')}
							</Text>
						</Row>
						<Row width="70%" mainAlignment="flex-end" crossAlignment="flex-end">
							<Padding right="large">
								<IconButton
									iconColor="gray6"
									backgroundColor="primary"
									icon="Plus"
									height={36}
									width={36}
								/>
							</Padding>
							<Padding right="large">
								<Button
									label={t('label.details', 'Details')}
									color="primary"
									type="outlined"
									disabled
									height={36}
								/>
							</Padding>
							<Button
								type="outlined"
								label={t('label.bulk_actions', 'Bulk Actions')}
								icon="ArrowIosDownward"
								iconPlacement="right"
								color="primary"
								disabled
								height={36}
							/>
						</Row>
					</Row>
				</Container>
			</Row>
			<Row orientation="horizontal" width="100%" background="gray6">
				<Divider />
			</Row>
			<Container
				orientation="column"
				crossAlignment="flex-start"
				mainAlignment="flex-start"
				width="100%"
				height="calc(100vh - 200px)"
				padding={{ top: 'extralarge' }}
			>
				<Row takeAvwidth="fill" mainAlignment="flex-start" width="100%">
					<Container height="fit" crossAlignment="flex-start" background="gray6">
						<Row
							orientation="horizontal"
							mainAlignment="space-between"
							crossAlignment="flex-start"
							width="fill"
							padding={{ bottom: 'large' }}
						>
							<Container>
								<Input
									backgroundColor="gray5"
									label={t('label.search_dot', 'Search ...')}
									onChange={(e: any): any => {
										setSearchString(e.target.value);
									}}
									CustomIcon={(): any => <Icon icon="FunnelOutline" size="large" color="primary" />}
								/>
							</Container>
						</Row>
						<Row
							orientation="horizontal"
							mainAlignment="space-between"
							crossAlignment="flex-start"
							width="fill"
							height="calc(100vh - 340px)"
						>
							{mailingList && mailingList.length > 0 && (
								<Table
									rows={mailingList}
									headers={headers}
									showCheckbox={false}
									style={{ overflow: 'auto', height: '100%' }}
								/>
							)}
							{mailingList.length === 0 && (
								<Container orientation="column" crossAlignment="center" mainAlignment="flex-start">
									<Row>
										<img src={logo} alt="logo" />
									</Row>
									<Row
										padding={{ top: 'extralarge' }}
										orientation="vertical"
										crossAlignment="center"
										style={{ 'text-align': 'center' }}
									>
										<Text weight="light" color="#828282" size="large" overflow="break-word">
											{t('label.this_list_is_empty', 'This list is empty.')}
										</Text>
									</Row>
									<Row
										orientation="vertical"
										crossAlignment="center"
										style={{ 'text-align': 'center' }}
										padding={{ top: 'small' }}
										width="53%"
									>
										<Text weight="light" color="#828282" size="large" overflow="break-word">
											<Trans
												i18nKey="label.create_mailing_list_msg"
												defaults="You can create a new Mailing List by clicking on <bold>Create</bold> button (upper left corner) or on the Add (<bold>+</bold>) button up here"
												components={{ bold: <strong /> }}
											/>
										</Text>
									</Row>
								</Container>
							)}
						</Row>
						<Row
							orientation="horizontal"
							mainAlignment="space-between"
							crossAlignment="flex-start"
							width="fill"
							padding={{ all: 'large' }}
						>
							{mailingList && mailingList.length > 0 && (
								<Paginig totalItem={totalAccount} setOffset={setOffset} pageSize={limit} />
							)}
						</Row>
					</Container>
				</Row>
			</Container>
			{showMailingListDetailView && (
				<EditMailingListView
					selectedMailingList={selectedMailingList}
					setShowMailingListDetailView={setShowMailingListDetailView}
				/>
			)}
		</Container>
	);
};

export default DomainMailingList;
