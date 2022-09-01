/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useContext } from 'react';
import { Container, Row, Input, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { volumeTypeList } from '../../../../utility/utils';
import { DISABLED, ENABLED } from '../../../../../constants';
import { VolumeContext } from './volume-context';

const MailstoresCreate: FC = () => {
	const context = useContext(VolumeContext);
	const { t } = useTranslation();
	const { volumeDetail, setVolumeDetail } = context;

	const changeVolDetail = useCallback(
		(e) => {
			console.log('__id', e.target.value);
			setVolumeDetail((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
		},
		[setVolumeDetail]
	);
	console.log('__', volumeDetail);

	return (
		<>
			<Container mainAlignment="flex-start" padding={{ horizontal: 'large' }}>
				<Row padding={{ top: 'large' }} width="100%">
					<Input
						label={t('label.volume_name', 'Volume Name')}
						backgroundColor="gray6"
						value={volumeDetail?.volumeName}
						readOnly
					/>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Row mainAlignment="flex-start" width="31.5%">
						<Input
							label={t('label.volume_type', 'Volume Type')}
							backgroundColor="gray6"
							value={
								volumeTypeList.find((item: any) => item.value === volumeDetail?.volumeMain)?.label
							}
							readOnly
						/>
					</Row>
					<Padding horizontal="small" />
					<Row mainAlignment="flex-end" width="31.5%">
						<Input
							label={t('label.current', 'Current')}
							backgroundColor="gray6"
							value={volumeDetail?.isCurrent ? ENABLED : DISABLED}
							readOnly
						/>
					</Row>
					<Padding horizontal="small" />
					<Row mainAlignment="flex-end" width="31.5%">
						<Input
							label={t('label.volume_allocation', 'Volume Allocation')}
							backgroundColor="gray6"
							value="Local"
							readOnly
						/>
					</Row>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Row mainAlignment="flex-start" width="31.5%">
						<Input
							label={t('label.volume_path', 'Volume path')}
							backgroundColor="gray6"
							value={volumeDetail?.path}
							readOnly
						/>
					</Row>
					<Padding horizontal="small" />
					<Row mainAlignment="flex-end" width="31.5%">
						<Input
							label={t('label.min_threshold', 'Min Threshold')}
							backgroundColor="gray6"
							value="--"
							readOnly
						/>
					</Row>
					<Padding horizontal="small" />
					<Row mainAlignment="flex-end" width="31.5%">
						<Input
							label={t('label.available_space', 'Available Space')}
							backgroundColor="gray6"
							value="98847126.224"
							readOnly
						/>
					</Row>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Row mainAlignment="flex-start" width="31.5%">
						<Input
							label={t('label.compression', 'Compression')}
							backgroundColor="gray6"
							value={volumeDetail?.isCompression ? ENABLED : DISABLED}
							readOnly
						/>
					</Row>
					<Padding horizontal="small" />
					<Row mainAlignment="flex-end" width="31.5%">
						<Input
							label={t('label.compression_threshold', 'Compression Threshold')}
							backgroundColor="gray6"
							value={volumeDetail?.compressionThreshold}
							readOnly
						/>
					</Row>
					<Padding horizontal="small" />
					<Row mainAlignment="flex-end" width="31.5%">
						<Input
							label={t('label.max_quota_allowed', 'Max Quota Allowed')}
							backgroundColor="gray6"
							value="1"
							readOnly
						/>
					</Row>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Row mainAlignment="flex-start" width="48%">
						<Input
							label={t('label.date_creation', 'Data Creation')}
							backgroundColor="gray6"
							value="Thu, 21/03/04, 02:24 PM"
							readOnly
						/>
					</Row>
					<Padding horizontal="small" />
					<Row mainAlignment="flex-end" width="48%">
						<Input
							inputName="id"
							label={t('label.volume_id', 'Volume ID')}
							backgroundColor="gray6"
							value={volumeDetail?.id}
							onChange={changeVolDetail}
						/>
					</Row>
				</Row>
			</Container>
		</>
	);
};

export default MailstoresCreate;
