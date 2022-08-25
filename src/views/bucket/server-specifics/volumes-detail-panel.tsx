/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Row, Text, Divider, Table, Button } from '@zextras/carbonio-design-system';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { NO, YES } from '../../../constants';
import { AbsoluteContainer } from '../../components/styled';
import ServerVolumeDetailsPanel from './server-volume-details-panel';
import { fetchSoap } from '../../../services/bucket-service';
import IndexerVolumeTable from './indexer-volume-table';
import { tableHeader, indexerHeaders } from '../../utility/utils';
import { useBucketVolumeStore } from '../../../store/bucket-volume/store';

const RelativeContainer = styled(Container)`
	position: relative;
`;

const VolumeListTable: FC<{
	volumes: Array<any>;
	selectedRows: any;
	onSelectionChange: any;
	headers: any;
	onClick: any;
}> = ({ volumes, selectedRows, onSelectionChange, headers, onClick }) => {
	const tableRows = useMemo(
		() =>
			volumes.map((v, i) => ({
				id: i,
				columns: [
					<Row
						key={i}
						onClick={(): void => {
							onClick(i);
						}}
						style={{ textAlign: 'left', justifyContent: 'flex-start' }}
					>
						{v.name}
					</Row>,
					<Row
						key={i}
						onClick={(): void => {
							onClick(i);
						}}
						style={{ textAlign: 'center' }}
					>
						{v.storeType}
					</Row>,
					<Row
						key={i}
						onClick={(): void => {
							onClick(i);
						}}
						style={{ textAlign: 'center' }}
					>
						<Text color={v.isCurrent ? 'text' : 'error'}>{v.isCurrent ? YES : NO}</Text>
					</Row>,
					<Row
						key={i}
						onClick={(): void => {
							onClick(i);
						}}
						style={{ textAlign: 'center' }}
					>
						<Text color={v.compressed ? 'text' : 'error'}>{v.compressed ? YES : NO}</Text>
					</Row>
				],
				clickable: true
			})),
		[onClick, volumes]
	);

	return (
		<Container crossAlignment="flex-start">
			<Table
				headers={headers}
				rows={tableRows}
				showCheckbox={false}
				multiSelect={false}
				selectedRows={selectedRows}
				onSelectionChange={onSelectionChange}
			/>
			{tableRows.length === 0 && (
				<Row padding={{ top: 'extralarge', horizontal: 'extralarge' }} width="fill">
					<Text>Empty Table</Text>
				</Row>
			)}
		</Container>
	);
};

const VolumesDetailPanel: FC = () => {
	const [t] = useTranslation();
	const selectedServerName = useBucketVolumeStore((state) => state.selectedServerName);
	const [volumeselection, setVolumeselection] = useState('');
	const [toggleDetailPage, setToggleDetailPage] = useState(false);
	const [volumeDetail, setVolumeDetail] = useState<number>(0);
	const [volumeList, setVolumeList] = useState<object | any>({
		primaries: [],
		indexes: [],
		secondaries: []
	});

	const GetAllVolumesRequest = useCallback((): void => {
		fetchSoap('GetAllVolumesRequest', {
			_jsns: 'urn:zimbraAdmin'
		}).then((response) => {
			const primaries = response.GetAllVolumesResponse.volume.filter(
				(item: any) => item.type === 1
			);
			const secondaries = response.GetAllVolumesResponse.volume.filter(
				(item: any) => item.type === 2
			);
			const indexes = response.GetAllVolumesResponse.volume.filter((item: any) => item.type === 10);
			setVolumeList({
				primaries,
				indexes,
				secondaries
			});
		});
	}, []);

	useEffect(() => {
		GetAllVolumesRequest();
	}, [GetAllVolumesRequest]);

	const handleClick = (i: number, data: any): void => {
		const volumeObject: any = data.find((s: any, index: any) => index === i);
		setVolumeDetail(volumeObject?.id);
		setToggleDetailPage(true);
	};
	return (
		<>
			{toggleDetailPage && volumeDetail && (
				<AbsoluteContainer orientation="vertical" background="gray5">
					<ServerVolumeDetailsPanel
						volumeDetail={volumeDetail}
						setToggleDetailPage={setToggleDetailPage}
					/>
				</AbsoluteContainer>
			)}
			<RelativeContainer
				orientation="column"
				crossAlignment="flex-start"
				mainAlignment="flex-start"
				style={{ overflowY: 'auto' }}
				background="white"
			>
				<Row mainAlignment="flex-start" padding={{ all: 'large' }}>
					<Text size="extralarge" weight="bold">
						{t('buckets.serverName_volumes', '{{serverName}} Volumes', {
							serverName: selectedServerName
						})}
					</Text>
				</Row>
				<Divider />
				<Container
					orientation="column"
					crossAlignment="flex-start"
					mainAlignment="flex-start"
					width="100%"
					height="calc(100vh - 200px)"
					padding={{ top: 'extralarge', bottom: 'large' }}
				>
					<Container height="fit" crossAlignment="flex-start" background="gray6">
						<Row
							width="100%"
							mainAlignment="flex-end"
							orientation="horizontal"
							padding={{ top: 'small', right: 'large', left: 'large' }}
							style={{ gap: '16px' }}
						>
							<Button
								type="outlined"
								label={t('label.delete_button', 'DELETE')}
								icon="CloseOutline"
								color="error"
								disabled
							/>
							<Button
								type="outlined"
								label={t('label.edit_button', 'EDIT')}
								icon="EditOutline"
								color="secondary"
								disabled
							/>
							<Button
								type="outlined"
								label={t('label.new_volume_button', 'NEW VOLUME')}
								icon="PlusOutline"
								color="primary"
							/>
						</Row>
						<Row
							width="100%"
							mainAlignment="flex-start"
							orientation="horizontal"
							padding={{ horizontal: 'large', top: 'large', bottom: 'small' }}
						>
							<Text>Primary</Text>
						</Row>
						<Row padding={{ horizontal: 'large' }} width="100%">
							<VolumeListTable
								volumes={volumeList?.primaries}
								headers={tableHeader}
								selectedRows={volumeselection}
								onSelectionChange={(selected: any): any => {
									setVolumeselection(selected);
								}}
								onClick={(i: any): any => {
									handleClick(i, volumeList?.primaries);
								}}
							/>
						</Row>
						<Row
							width="100%"
							mainAlignment="flex-start"
							orientation="horizontal"
							padding={{
								horizontal: 'large',
								vertical: 'extralarge'
							}}
						>
							<Container
								orientation="horizontal"
								mainAlignment="flex-start"
								style={{ gap: '16px' }}
							>
								<Button
									type="outlined"
									width="fill"
									label={t('label.set_as_secondary_button', 'SET AS SECONDARY')}
									icon="ArrowheadDown"
									iconPlacement="left"
									color="primary"
									disabled
								/>
								<Button
									type="outlined"
									width="fill"
									label={t('label.new_volumeset_as_primary_button', 'SET AS PRIMARY')}
									icon="ArrowheadUp"
									iconPlacement="left"
									color="secondary"
									disabled
								/>
							</Container>
						</Row>
						<Row
							width="100%"
							mainAlignment="flex-start"
							orientation="horizontal"
							padding={{
								horizontal: 'large',
								bottom: 'small'
							}}
						>
							<Text>Secondary</Text>
						</Row>
						<Row
							padding={{
								horizontal: 'large',
								bottom: 'extralarge'
							}}
							width="100%"
						>
							<VolumeListTable
								volumes={volumeList?.secondaries}
								headers={tableHeader}
								selectedRows={volumeselection}
								onSelectionChange={(selected: any): any => {
									setVolumeselection(selected);
								}}
								onClick={(i: any): any => {
									handleClick(i, volumeList?.secondaries);
								}}
							/>
						</Row>
						<Row
							width="100%"
							mainAlignment="flex-start"
							orientation="horizontal"
							padding={{
								horizontal: 'large',
								vertical: 'small'
							}}
						>
							<Text>Indexer</Text>
						</Row>
						<Row
							padding={{
								horizontal: 'large',
								bottom: 'extralarge'
							}}
							width="100%"
						>
							<IndexerVolumeTable
								volumes={volumeList?.indexes}
								headers={indexerHeaders}
								selectedRows={volumeselection}
								onSelectionChange={(selected: any): any => {
									setVolumeselection(selected);
								}}
								onClick={(i: any): any => {
									handleClick(i, volumeList?.indexes);
								}}
							/>
						</Row>
					</Container>
				</Container>
			</RelativeContainer>
		</>
	);
};

export default VolumesDetailPanel;
