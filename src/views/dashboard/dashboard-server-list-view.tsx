/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useEffect, useMemo, useState } from 'react';
import { Container, Icon, Button, Table, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import ListRow from '../list/list-row';
import { useServerStore } from '../../store/server/store';
import { Server } from '../../../types';

const DashboardServerList: FC = () => {
	const [t] = useTranslation();
	const serverList = useServerStore((state) => state.serverList || []);
	const [serverListRow, setServerListRow] = useState<Array<any>>([]);
	useEffect(() => {
		if (serverList.length > 0) {
			const allRows = serverList.map((item: Server) => ({
				id: item?.id,
				columns: [
					<Text
						size="small"
						color="gray0"
						weight="bold"
						key={item}
						onClick={(event: { stopPropagation: () => void }): void => {
							event.stopPropagation();
						}}
					>
						{item?.name}
					</Text>,
					<Text
						size="small"
						color="gray0"
						weight="bold"
						key={item}
						onClick={(event: { stopPropagation: () => void }): void => {
							event.stopPropagation();
						}}
					>
						{''}
					</Text>,
					<Text
						size="small"
						weight="bold"
						color="gray0"
						key={item}
						onClick={(event: { stopPropagation: () => void }): void => {
							event.stopPropagation();
						}}
					>
						{''}
					</Text>,
					<Text
						size="small"
						weight="bold"
						color="gray0"
						key={item}
						onClick={(event: { stopPropagation: () => void }): void => {
							event.stopPropagation();
						}}
					>
						{''}
					</Text>,
					<Text
						size="small"
						weight="bold"
						color="gray0"
						key={item}
						onClick={(event: { stopPropagation: () => void }): void => {
							event.stopPropagation();
						}}
					>
						{''}
					</Text>
				]
			}));
			setServerListRow(allRows);
		} else {
			setServerListRow([]);
		}
	}, [serverList]);

	const headers: any[] = useMemo(
		() => [
			{
				id: 'server_name',
				label: t('dashboard.server_name', 'Server name'),
				width: '20%',
				bold: true
			},
			{
				id: 'server_ip',
				label: t('dashboard.server_ip', 'Server IP'),
				width: '20%',
				bold: true
			},
			{
				id: 'carbonio_core',
				label: t('dashboard.carbonio_core', 'Carbonio Core'),
				width: '20%',
				bold: true
			},
			{
				id: 'carbonio',
				label: t('dashboard.carbonio', 'Carbonio'),
				width: '40%',
				bold: true
			},
			{
				id: 'description',
				label: t('dashboard.description', 'Description'),
				width: '40%',
				bold: true
			}
		],
		[t]
	);

	return (
		<Container background="gray6">
			<ListRow>
				<Container
					padding={{ all: 'extralarge' }}
					mainAlignment="flex-start"
					crossAlignment="flex-start"
				>
					<ListRow>
						<Container mainAlignment="flex-start" crossAlignment="flex-start" width="2.2rem">
							<Icon icon="HardDriveOutline" height={'1.5rem'} width="1.5rem" />
						</Container>
						<Container mainAlignment="center" crossAlignment="flex-start">
							<Text size="medium" color="gray0" weight="bold">
								{t('label.server_list', 'Servers List')}
							</Text>
						</Container>
					</ListRow>
				</Container>
				<Container
					mainAlignment="flex-end"
					crossAlignment="flex-end"
					padding={{ all: 'extralarge' }}
				>
					<Button
						type="ghost"
						label={t('dashboard.go_to_mailstores_server_list', 'Go to mailstores servers list')}
						color="primary"
					/>
				</Container>
			</ListRow>
			<ListRow>
				<Container
					orientation="horizontal"
					mainAlignment="space-between"
					crossAlignment="flex-start"
					width="fill"
					height="calc(100vh - 400px)"
				>
					<Table
						rows={serverListRow}
						headers={headers}
						showCheckbox={false}
						multiSelect={false}
						style={{ overflow: 'auto', height: '100%' }}
					/>
				</Container>
			</ListRow>
		</Container>
	);
};
export default DashboardServerList;
