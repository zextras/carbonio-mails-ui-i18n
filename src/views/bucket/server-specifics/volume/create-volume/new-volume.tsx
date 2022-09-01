/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useState } from 'react';
import { Button } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { HorizontalWizard } from '../../../../app/component/hwizard';
import { Section } from '../../../../app/component/section';
import MailstoresConfig from './mailstores-config';
import MailstoresVolume from './mailstores-volume';
import MailstoresCreate from './mailstores-create';
import { VolumeContext } from './volume-context';
import { fetchSoap } from '../../../../../services/bucket-service';

const WizardInSection: FC<any> = ({
	wizard,
	wizardFooter,
	setToggleWizardSection,
	externalData
}) => {
	const { t } = useTranslation();
	return (
		<Section
			title={t(
				'volume.serverName_volumes_create_mailstores_volume',
				'{{serverName}} | Create Mailstores Volume',
				{
					serverName: externalData
				}
			)}
			padding={{ all: '0' }}
			footer={wizardFooter}
			divider
			showClose
			onClose={(): void => {
				setToggleWizardSection(false);
			}}
		>
			{wizard}
		</Section>
	);
};

interface VolumeDetailObj {
	id: string;
	volumeName: string;
	volumeMain: number;
	path: string;
	isCurrent: boolean;
	isCompression: boolean;
	compressionThreshold: string;
}

const NewVolume: FC<{
	setToggleWizardSection: any;
	setDetailsVolume: any;
	volName: any;
	setCreateMailstoresVolumeData: any;
	CreateVolumeRequest: any;
}> = ({
	setToggleWizardSection,
	setDetailsVolume,
	volName,
	setCreateMailstoresVolumeData,
	CreateVolumeRequest
}) => {
	const { t } = useTranslation();
	const [wizardData, setWizardData] = useState();
	const [volumeDetail, setVolumeDetail] = useState<VolumeDetailObj>({
		id: '',
		volumeName: '',
		volumeMain: 0,
		path: '',
		isCurrent: false,
		isCompression: false,
		compressionThreshold: ''
	});
	const wizardSteps = [
		{
			name: 'volume',
			label: t('label.new_volume', 'VOLUME'),
			icon: 'CubeOutline',
			view: MailstoresVolume,
			canGoNext: (): any => true,
			CancelButton: (props: any) => (
				<Button
					{...props}
					type="outlined"
					key="wizard-cancel"
					label={t('label.volume_cancel_button', 'CANCEL')}
					icon={'CloseOutline'}
					iconPlacement="right"
					color="secondary"
					onClick={(): void => setToggleWizardSection(false)}
				/>
			),
			PrevButton: (props: any): any => '',
			NextButton: (props: any): any => (
				<Button
					{...props}
					label={t('label.volume_next_step_button', 'NEXT STEP')}
					icon={'ChevronRightOutline'}
					iconPlacement="right"
					disable={props.completeLoading}
				/>
			)
		},
		{
			name: 'config',
			label: t('label.new_volume_config', 'CONFIG'),
			icon: 'Options2Outline',
			view: MailstoresConfig,
			canGoNext: (): any => true,
			CancelButton: (props: any) => (
				<Button
					{...props}
					type="outlined"
					key="wizard-cancel"
					label={t('label.volume_cancel_button', 'CANCEL')}
					icon={'CloseOutline'}
					iconPlacement="right"
					color="secondary"
					onClick={(): void => setToggleWizardSection(false)}
				/>
			),
			PrevButton: (props: any): any => (
				<Button
					{...props}
					label={t('label.volume_back_button', 'BACK')}
					icon={'ChevronLeftOutline'}
					iconPlacement="left"
					disable={props.completeLoading}
					color="secondary"
				/>
			),
			NextButton: (props: any): any => (
				<Button
					{...props}
					label={t('label.volume_next_step_button', 'NEXT STEP')}
					icon={'ChevronRightOutline'}
					iconPlacement="right"
					disable={props.completeLoading}
				/>
			)
		},
		{
			name: 'create',
			label: t('label.new_volume_create', 'CREATE'),
			icon: 'CubeOutline',
			view: MailstoresCreate,
			canGoNext: (): any => true,
			CancelButton: (props: any) => (
				<Button
					{...props}
					type="outlined"
					key="wizard-cancel"
					label={t('label.volume_cancel_button', 'CANCEL')}
					icon={'CloseOutline'}
					iconPlacement="right"
					color="secondary"
					onClick={(): void => setToggleWizardSection(false)}
				/>
			),
			PrevButton: (props: any): any => (
				<Button
					{...props}
					label={t('label.volume_back_button', 'BACK')}
					icon={'ChevronLeftOutline'}
					iconPlacement="left"
					disable={props.completeLoading}
					color="secondary"
				/>
			),
			NextButton: (props: any): any => (
				<Button
					{...props}
					label={t('label.volume_create_with_this_data_button', 'CREATE WITH THESE DATA')}
					icon={'CubeOutline'}
					iconPlacement="right"
					disable={props.completeLoading}
					onClick={(): any => CreateVolumeRequest(volumeDetail)}
				/>
			)
		}
	];

	const onComplete = useCallback(
		(data) => {
			setCreateMailstoresVolumeData(data.steps.connection);
			setToggleWizardSection(false);
			setDetailsVolume(false);
		},
		[setToggleWizardSection, setDetailsVolume, setCreateMailstoresVolumeData]
	);
	return (
		<VolumeContext.Provider value={{ volumeDetail, setVolumeDetail }}>
			<HorizontalWizard
				steps={wizardSteps}
				Wrapper={WizardInSection}
				onChange={setWizardData}
				onComplete={onComplete}
				setToggleWizardSection={setToggleWizardSection}
				externalData={volName}
			/>
		</VolumeContext.Provider>
	);
};

export default NewVolume;
