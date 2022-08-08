/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react-hooks/rules-of-hooks */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useMemo, useState } from 'react';
import {
	Container,
	Row,
	Text,
	Divider,
	Switch,
	Table,
	Padding,
	Input,
	Button,
	Icon
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import ListRow from '../list/list-row';
import Paginig from '../components/paging';
import { useCosStore } from '../../store/cos/store';
import { getAllServers } from '../../services/get-all-servers-service';

const CosServerPools: FC = () => {
	const [t] = useTranslation();
	const cosInformation = useCosStore((state) => state.cos?.a);
	const [zimbraMailHostPool, setZimbraMailHostPool] = useState<boolean>(false);
	const [serverList, setServerList] = useState<Array<any>>([]);
	const [zimbraMailHostPoolList, setZimbraMailHostPoolList] = useState<Array<any>>([]);
	const [serverTableRows, setServerTableRows] = useState<Array<any>>([]);
	const [selectedTableRows, setSelectedTableRows] = useState<Array<any>>([]);

	const getAllServer = (): any => {
		getAllServers()
			.then((res) => res.json())
			.then((data) => {
				const server = data?.Body?.GetAllServersResponse?.server;
				if (!!data && server && Array.isArray(server)) {
					setServerList(server);
				}
			});
	};

	useEffect(() => {
		if (serverList && serverList.length > 0) {
			const allRows = serverList.map((item: any) => ({
				id: item?.id,
				columns: [
					<Text size="small" weight="light" key={item?.id} color="#414141">
						{item?.name}
					</Text>,
					<Text key={item?.id}>
						{zimbraMailHostPoolList.find((sp: any) => item?.id === sp?._content)?.c ? (
							<Text size="small" weight="light">
								{t('cos.enabled', 'Enabled')}
							</Text>
						) : (
							<Text size="small" weight="light" color="error">
								{t('cos.disabled', 'Disabled')}
							</Text>
						)}
					</Text>
				]
			}));
			setServerTableRows(allRows);
		}
	}, [serverList, zimbraMailHostPoolList, t]);

	const enable = useMemo(
		() =>
			selectedTableRows.length > 0 &&
			!zimbraMailHostPoolList.find((sp: any) => selectedTableRows[0] === sp?._content)?.c,
		[selectedTableRows, zimbraMailHostPoolList]
	);

	const disable = useMemo(
		() =>
			selectedTableRows.length > 0 &&
			zimbraMailHostPoolList.find((sp: any) => selectedTableRows[0] === sp?._content)?.c,
		[selectedTableRows, zimbraMailHostPoolList]
	);
	useEffect(() => {
		if (!!cosInformation && cosInformation.length > 0) {
			getAllServer();
			const _zimbraMailHostPool: any = cosInformation.find(
				(item: any) => item?.n === 'zimbraMailHostPool'
			);
			if (_zimbraMailHostPool) {
				setZimbraMailHostPool(_zimbraMailHostPool?.c);
			}

			const list = cosInformation.filter((item: any) => item?.n === 'zimbraMailHostPool');
			if (list) {
				setZimbraMailHostPoolList(list);
			}
		}
	}, [cosInformation]);

	const tableHeader: any[] = useMemo(
		() => [
			{
				id: 'name_server',
				label: t('cos.name_server', 'Name Server'),
				width: '80%',
				bold: true
			},
			{
				id: 'status',
				label: t('cos.status', 'Status'),
				width: '100px',
				bold: true,
				items: [
					{ label: t('cos.enabled', 'Enabled'), value: 'enabled' },
					{ label: t('cos.disabled', 'Disabled'), value: 'disabled' }
				],
				onChange: (e: any) => console.log('Filter changed', e)
			}
		],
		[t]
	);

	return (
		<Container mainAlignment="flex-start" crossAlignment="flex-start">
			<Row mainAlignment="flex-start" padding={{ all: 'large' }}>
				<Text size="medium" weight="bold">
					{t('label.server_pools', '"Server Pools')}
				</Text>
			</Row>
			<Divider />
			<Container
				orientation="column"
				crossAlignment="flex-start"
				mainAlignment="flex-start"
				style={{ overflow: 'auto' }}
				width="100%"
			>
				<Container
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					padding={{ top: 'extralarge', right: 'large', bottom: 'large', left: 'large' }}
					width="100%"
				>
					<ListRow>
						<Text size="small" weight="bold">
							{t('cos.general_options', 'General Options')}
						</Text>
					</ListRow>
					<ListRow>
						<Padding bottom="large" top="large">
							<Switch
								value={zimbraMailHostPool}
								label={t(
									'cos.limt_serverpool_avaiable_create_user',
									'Limit server pool available for creating new users in this COS'
								)}
							/>
						</Padding>
					</ListRow>
					<Row
						takeAvwidth="fill"
						mainAlignment="flex-start"
						width="100%"
						padding={{ top: 'small', bottom: 'small' }}
					>
						<Container
							orientation="vertical"
							mainAlignment="space-around"
							background="gray6"
							height="58px"
						>
							<Row
								orientation="horizontal"
								mainAlignment="flex-start"
								crossAlignment="flex-start"
								width="100%"
							>
								<Row mainAlignment="flex-start" width="70%" crossAlignment="flex-start">
									<Input
										value={''}
										label={t('cos.search_a_specific_server', 'Search a specific server')}
										CustomIcon={(): any => (
											<Icon icon="FunnelOutline" size="large" color="secondary" />
										)}
									/>
								</Row>

								<Row width="30%" mainAlignment="flex-start" crossAlignment="flex-start">
									<Padding left="large" right="large">
										<Button
											type="outlined"
											key="add-button"
											label={t('label.enable', 'enable')}
											color="primary"
											icon="CheckmarkCircleOutline"
											height={44}
											iconPlacement="right"
											disabled={!enable}
										/>
									</Padding>

									<Button
										type="outlined"
										key="add-button"
										label={t('label.disable', 'disable')}
										color="error"
										icon="CloseCircleOutline"
										iconPlacement="right"
										height={44}
										disabled={!disable}
									/>
								</Row>
							</Row>
						</Container>
					</Row>
					<ListRow>
						<Table
							multiSelect={false}
							rows={serverTableRows}
							headers={tableHeader}
							showCheckbox={false}
							selectedRows={selectedTableRows}
							onSelectionChange={(selected: any): void => setSelectedTableRows(selected)}
						/>
					</ListRow>
					<ListRow>
						<Divider />
					</ListRow>
					<ListRow>
						<Paginig
							totalItem={1}
							pageSize={10}
							setOffset={(): void => {
								console.log('setOffset for paging');
							}}
						/>
					</ListRow>
				</Container>
			</Container>
		</Container>
	);
};

export default CosServerPools;
