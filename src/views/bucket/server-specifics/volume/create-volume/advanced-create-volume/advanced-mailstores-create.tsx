/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useContext, useEffect, useMemo, useState } from 'react';
import { Container, Row, Input, Padding, Text, Table } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { volumeTypeList } from '../../../../../utility/utils';
import { AdvancedVolumeContext } from './create-advanced-volume-context';
import { DISABLED, ENABLED, NO, S3, YES } from '../../../../../../constants';
// import logo from '../../../../../../assets/gardian.svg';

// const VolumeCreateTable: FC<{
// 	volumes: Array<any>;
// 	selectedRows: any;
// 	onSelectionChange: any;
// 	headers: any;
// 	onClick: any;
// }> = ({ volumes, selectedRows, onSelectionChange, headers, onClick }) => {
// 	const [t] = useTranslation();
// 	const tableRows = useMemo(
// 		() =>
// 			volumes.map((v, i) => ({
// 				id: v?.id,
// 				columns: [
// 					<Row
// 						key={i}
// 						onClick={(): void => {
// 							onClick(i);
// 						}}
// 						style={{ textAlign: 'left', justifyContent: 'flex-start' }}
// 					>
// 						{v?.name}
// 					</Row>,
// 					<Row
// 						key={i}
// 						onClick={(): void => {
// 							onClick(i);
// 						}}
// 						style={{ textAlign: 'left', justifyContent: 'flex-center' }}
// 					>
// 						{v?.hsmSchedule === '1' ? YES : NO}
// 					</Row>,
// 					<Row
// 						key={i}
// 						onClick={(): void => {
// 							onClick(i);
// 						}}
// 						style={{ textAlign: 'left', justifyContent: 'flex-center' }}
// 					>
// 						{v?.indexer === '1' ? YES : NO}
// 					</Row>
// 				],
// 				clickable: true
// 			})),
// 		[onClick, volumes]
// 	);

// 	return (
// 		<Container crossAlignment="flex-start">
// 			<Table
// 				headers={headers}
// 				rows={tableRows}
// 				showCheckbox={false}
// 				multiSelect={false}
// 				selectedRows={selectedRows}
// 				onSelectionChange={onSelectionChange}
// 			/>
// 			{tableRows.length === 0 && (
// 				<Row padding={{ top: 'extralarge', horizontal: 'extralarge' }} width="fill">
// 					<Text overflow="break-word" weight="normal" size="large">
// 						<Padding top="extralarge" />
// 						<Padding top="large" />
// 						<img src={logo} alt="logo" />
// 					</Text>
// 				</Row>
// 			)}
// 		</Container>
// 	);
// };

const AdvancedMailstoresCreate: FC<{
	externalData: string;
	setCompleteLoading: any;
}> = ({ externalData, setCompleteLoading }) => {
	const context = useContext(AdvancedVolumeContext);
	const { t } = useTranslation();
	const { advancedVolumeDetail } = context;
	// const volConfigHeader = useMemo(() => volumeConfigHeader(t), [t]);
	const volTypeList = useMemo(() => volumeTypeList(t), [t]);
	const [volumeType, setVolumeType] = useState<any>('');
	const [bucketS3, setBucketS3] = useState(false);
	// const [volumeCreateSelection, setVolumeCreateSelection] = useState(false);

	// const volumeCreateList: Array<any> = [
	// 	{
	// 		name: 'servername#1',
	// 		hsmSchedule: '0',
	// 		indexer: '1'
	// 	}
	// ];
	useEffect(() => {
		if (
			advancedVolumeDetail?.volumeAllocation &&
			advancedVolumeDetail?.volumeName &&
			advancedVolumeDetail?.unusedBucketType &&
			volumeType
		) {
			setCompleteLoading(true);
		} else {
			setCompleteLoading(false);
		}
	}, [advancedVolumeDetail, setCompleteLoading, volumeType]);

	useEffect(() => {
		const volumeTypeObject = volTypeList.find(
			(item: any) => item.value === advancedVolumeDetail?.volumeMain
		)?.label;
		setVolumeType(volumeTypeObject);
	}, [advancedVolumeDetail?.volumeMain, volTypeList]);

	useEffect(() => {
		if (advancedVolumeDetail?.unusedBucketType === S3) {
			setBucketS3(true);
		} else {
			setBucketS3(false);
		}
	}, [advancedVolumeDetail?.unusedBucketType]);

	return (
		<>
			<Container mainAlignment="flex-start" padding={{ horizontal: 'large' }}>
				<Row padding={{ top: 'large' }} width="100%">
					<Input
						inputName="server"
						label={t('label.volume_server_name', 'Server')}
						backgroundColor="gray6"
						value={externalData}
					/>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Input
						label={t('label.volume_allocation', 'Allocation')}
						backgroundColor="gray6"
						value={advancedVolumeDetail?.volumeAllocation}
						readOnly
					/>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Input
						label={t('label.volume_name', 'Volume Name')}
						value={advancedVolumeDetail?.volumeName}
						backgroundColor="gray6"
						readOnly
					/>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Row width="31.5%" mainAlignment="flex-start">
						<Input
							label={t('label.bucket_name', 'Bucket Name')}
							backgroundColor="gray6"
							value={advancedVolumeDetail?.bucketName}
							readOnly
						/>
					</Row>
					<Padding horizontal="small" />
					<Row width="31.5%" mainAlignment="flex-start">
						<Input
							label={t('label.type', 'Type')}
							backgroundColor="gray6"
							value={advancedVolumeDetail?.unusedBucketType}
							readOnly
						/>
					</Row>
					<Padding horizontal="small" />
					<Row width="31.5%" mainAlignment="flex-start">
						<Input
							label={t('label.ID', 'ID')}
							backgroundColor="gray6"
							value={advancedVolumeDetail?.bucketId}
							readOnly
						/>
					</Row>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Input
						label={t('label.type_of_volume', 'Type of Volume')}
						value={volumeType}
						backgroundColor="gray6"
						readOnly
					/>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Input
						label={t(
							'label.prefix_name',
							'Prefix - all objects will have this prefix in their name'
						)}
						value={advancedVolumeDetail?.prefix}
						backgroundColor="gray6"
						readOnly
					/>
				</Row>
				{bucketS3 && (
					<>
						<Row padding={{ top: 'large' }} width="100%">
							<Input
								label={t('label.infrequent_access', 'Infrequent access')}
								value={advancedVolumeDetail?.isCurrent ? ENABLED : DISABLED}
								backgroundColor="gray6"
								readOnly
							/>
						</Row>
						<Row padding={{ top: 'large' }} width="100%">
							<Input
								label={t('label.use_intelligent_tiering', 'Use Intelligent Tiering')}
								value={advancedVolumeDetail?.isCurrent ? ENABLED : DISABLED}
								backgroundColor="gray6"
								readOnly
							/>
						</Row>
					</>
				)}
				<Row padding={{ top: 'large' }} width="100%">
					<Input
						label={t('label.volume_as_current', 'Volum as current')}
						value={advancedVolumeDetail?.isCurrent ? YES : NO}
						backgroundColor="gray6"
						readOnly
					/>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Input
						label={t('label.centralized', 'Centralized')}
						value={advancedVolumeDetail?.centralized ? YES : NO}
						backgroundColor="gray6"
						readOnly
					/>
				</Row>
				{/* <Row padding={{ top: 'large' }} width="100%">
					<VolumeCreateTable
						volumes={volumeCreateList}
						headers={volConfigHeader}
						selectedRows={volumeCreateSelection}
						onSelectionChange={(selected: any): any => {
							setVolumeCreateSelection(selected);
						}}
						onClick={(i: any): any => {
							// handleClick(i, volumeList?.primaries);
						}}
					/>
				</Row> */}
			</Container>
		</>
	);
};

export default AdvancedMailstoresCreate;
