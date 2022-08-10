/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import { Container, Button } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { Section } from '../../../app/component/section';
import { HorizontalWizard } from '../../../app/component/hwizard';
import RestoreSelectAccountSection from './restore-delete-account-select-section';
import RestoreAccountStartSection from './restore-delete-account-start-section';
import RestoreAccountConfigSection from './restore-delete-account-config-section';
import { RestoreDeleteAccountContext } from './restore-delete-account-context';

const WizardInSection: FC<any> = ({ wizard, wizardFooter, setToggleWizardSection }) => {
	const { t } = useTranslation();
	return (
		<Section
			title={t('label.restore_account', 'Restore Account')}
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

const RestoreDeleteAccountWizard: FC<{
	setShowRestoreAccountWizard: any;
	restoreAccountRequest: any;
}> = ({ setShowRestoreAccountWizard, restoreAccountRequest }) => {
	const { t } = useTranslation();
	const [wizardData, setWizardData] = useState();

	const onComplete = useCallback(() => {
		console.log('Completed');
	}, []);
	interface AccountDetailObj {
		name: string;
		id: string;
		createDate: string;
		status: string;
		copyAccount: string;
		dateTime: any;
		lastAvailableStatus: boolean;
		hsmApply: boolean;
		dataSource: boolean;
		isEmailNotificationEnable: boolean;
		notificationReceiver: string;
	}
	const [restoreAccountDetail, setRestoreAccountDetail] = useState<AccountDetailObj>({
		name: '',
		id: '',
		createDate: '',
		status: '',
		copyAccount: '',
		dateTime: null,
		lastAvailableStatus: false,
		hsmApply: false,
		dataSource: false,
		isEmailNotificationEnable: false,
		notificationReceiver: ''
	});

	const onRestoreAccount = useCallback(() => {
		restoreAccountRequest(
			restoreAccountDetail?.name,
			restoreAccountDetail?.id,
			restoreAccountDetail?.createDate,
			restoreAccountDetail?.status,
			restoreAccountDetail?.copyAccount
		);
	}, [restoreAccountDetail, restoreAccountRequest]);

	const wizardSteps = useMemo(
		() => [
			{
				name: 'details',
				label: t('label.select_an_account', 'Select An Account'),
				icon: 'AtOutline',
				view: RestoreSelectAccountSection,
				CancelButton: (props: any): ReactElement => (
					<Button
						{...props}
						type="outlined"
						key="wizard-cancel"
						label={t('label.cancel', 'Cancel')}
						color="secondary"
						icon="CloseOutline"
						iconPlacement="right"
						onClick={(): void => {
							setShowRestoreAccountWizard(false);
						}}
					/>
				),
				PrevButton: (props: any) => (
					<Button
						{...props}
						label={t('label.back', 'BACK')}
						icon="ChevronLeftOutline"
						color="secondary"
						iconPlacement="left"
						disabled
					/>
				),
				NextButton: (props: any) => (
					<Button
						{...props}
						label={t('label.next', 'NEXT')}
						icon="ChevronRightOutline"
						iconPlacement="right"
					/>
				)
			},
			{
				name: 'members',
				label: t('label.config', 'Config'),
				icon: 'OptionsOutline',
				view: RestoreAccountConfigSection,
				CancelButton: (props: any): ReactElement => (
					<Button
						{...props}
						type="outlined"
						key="wizard-cancel"
						label={t('label.cancel', 'Cancel')}
						color="secondary"
						icon="CloseOutline"
						iconPlacement="right"
						onClick={(): void => {
							setShowRestoreAccountWizard(false);
						}}
					/>
				),
				PrevButton: (props: any) => (
					<Button
						{...props}
						label={t('label.back', 'BACK')}
						icon="ChevronLeftOutline"
						color="secondary"
						iconPlacement="left"
					/>
				),
				NextButton: (props: any) => (
					<Button
						{...props}
						label={t('label.next', 'NEXT')}
						icon="ChevronRightOutline"
						iconPlacement="right"
					/>
				)
			},
			{
				name: 'create',
				label: t('label.start', 'start'),
				icon: 'ActivityOutline',
				view: RestoreAccountStartSection,
				CancelButton: (props: any): ReactElement => (
					<Button
						{...props}
						type="outlined"
						key="wizard-cancel"
						label={t('label.cancel', 'Cancel')}
						color="secondary"
						icon="CloseOutline"
						iconPlacement="right"
						onClick={(): void => {
							setShowRestoreAccountWizard(false);
						}}
					/>
				),
				PrevButton: (props: any) => (
					<Button
						{...props}
						label={t('label.back', 'BACK')}
						icon="ChevronLeftOutline"
						color="secondary"
						iconPlacement="left"
					/>
				),
				NextButton: (props: any) => (
					<Button
						{...props}
						label={t('label.restore_account', 'Restore Account')}
						icon="PowerOutline"
						iconPlacement="right"
						onClick={onRestoreAccount}
					/>
				)
			}
		],
		[t, setShowRestoreAccountWizard, onRestoreAccount]
	);

	return (
		<Container background="gray5" mainAlignment="flex-start">
			<RestoreDeleteAccountContext.Provider
				value={{ restoreAccountDetail, setRestoreAccountDetail }}
			>
				<HorizontalWizard
					steps={wizardSteps}
					Wrapper={WizardInSection}
					onChange={setWizardData}
					onComplete={onComplete}
					setToggleWizardSection={setShowRestoreAccountWizard}
				/>
			</RestoreDeleteAccountContext.Provider>
		</Container>
	);
};

export default RestoreDeleteAccountWizard;
