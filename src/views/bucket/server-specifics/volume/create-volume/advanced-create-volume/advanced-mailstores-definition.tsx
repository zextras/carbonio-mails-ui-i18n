/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { Container, Row, Input, Select, Switch, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { volumeAllocationList } from '../../../../../utility/utils';
import { VolumeContext } from '../volume-context';
import { PRIMARY_TYPE_VALUE, SECONDARY_TYPE_VALUE } from '../../../../../../constants';

const AdvancedMailstoresDefinition: FC<{
	externalData: any;
	setCompleteLoading: any;
	setToggleNextBtn: any;
}> = ({ externalData, setToggleNextBtn }) => {
	const { t } = useTranslation();
	const context = useContext(VolumeContext);
	const { volumeDetail, setVolumeDetail } = context;
	const [allocation, setAllocation] = useState<any>();

	const changeVolDetail = useCallback(
		(e) => {
			setVolumeDetail((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
		},
		[setVolumeDetail]
	);

	const onVolAllocationChange = (v: any): any => {
		setVolumeDetail((prev: any) => ({ ...prev, volumeAllocation: v }));
		if (v === PRIMARY_TYPE_VALUE) {
			setToggleNextBtn(true);
		} else if (v === SECONDARY_TYPE_VALUE) {
			setToggleNextBtn(false);
		}
	};

	useEffect(() => {
		const VolumeTypeObject = volumeAllocationList.find(
			(item: any) => item.value === volumeDetail?.volumeAllocation
		);
		setAllocation(VolumeTypeObject);
	}, [volumeDetail?.volumeAllocation]);

	return (
		<>
			<Container mainAlignment="flex-start" padding={{ horizontal: 'large' }}>
				<Row padding={{ top: 'large' }} width="100%">
					<Input
						inputName="server"
						label={t('label.volume_server_name', 'Server')}
						backgroundColor="gray6"
						value={externalData}
						readOnly
					/>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Select
						items={volumeAllocationList}
						background="gray5"
						label={t('label.volume_allocation', 'Allocation')}
						showCheckbox={false}
						selection={allocation}
						onChange={onVolAllocationChange}
					/>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Input
						inputName="volumeName"
						label={t('label.volume_name', 'Volume Name')}
						backgroundColor="gray5"
						value={volumeDetail?.volumeName}
						onChange={changeVolDetail}
					/>
				</Row>
				<Row padding={{ top: 'large' }} width="100%">
					<Input
						inputName="path"
						label={t('label.volume_path', 'Path')}
						backgroundColor="gray5"
						value={volumeDetail?.path}
						onChange={changeVolDetail}
					/>
				</Row>
			</Container>
		</>
	);
};

export default AdvancedMailstoresDefinition;
