/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useContext, useState } from 'react';
import { Container, Input, Row, Switch, DateTimePicker } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ListRow from '../../../list/list-row';
import { RestoreDeleteAccountContext } from './restore-delete-account-context';

const RestoreDeleteAccountConfigSection: FC<any> = () => {
	const { t } = useTranslation();
	const context = useContext(RestoreDeleteAccountContext);
	const { restoreAccountDetail, setRestoreAccountDetail } = context;
	const [date, setDate] = useState(
		restoreAccountDetail?.dateTime === null ? new Date() : restoreAccountDetail?.dateTime
	);
	const handleChange = useCallback(
		(d) => {
			setDate(d);
			setRestoreAccountDetail((prev: any) => ({
				...prev,
				dateTime: d
			}));
		},
		[setRestoreAccountDetail]
	);
	return (
		<Container
			orientation="column"
			crossAlignment="flex-start"
			mainAlignment="flex-start"
			width="100%"
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
						<ListRow>
							<Input
								backgroundColor="gray5"
								label={t(
									'label.account_data_copy_to_account',
									'The account data will be copied to this account'
								)}
								value={restoreAccountDetail?.copyAccount}
								onChange={(e: any): void => {
									setRestoreAccountDetail((prev: any) => ({
										...prev,
										copyAccount: e.target.value
									}));
								}}
							/>
						</ListRow>
						<ListRow>
							<Container crossAlignment="flex-start">
								<Switch
									value={restoreAccountDetail?.lastAvailableStatus}
									label={t('label.use_last_available_status', 'Use last available status')}
									onClick={(): void => {
										setRestoreAccountDetail((prev: any) => ({
											...prev,
											lastAvailableStatus: !restoreAccountDetail?.lastAvailableStatus
										}));
									}}
								/>
							</Container>

							<Container crossAlignment="flex-start">
								<DateTimePicker
									label={t('label.date_time_picker', 'Date Time Picker')}
									defaultValue={date}
									onChange={handleChange}
									dateFormat="dd/MM/yyyy hh:mm"
								/>
							</Container>
						</ListRow>

						<ListRow>
							<Switch
								value={restoreAccountDetail?.hsmApply}
								label={t('label.hsm_apply', 'HSM Apply')}
								onClick={(): void => {
									setRestoreAccountDetail((prev: any) => ({
										...prev,
										hsmApply: !restoreAccountDetail?.hsmApply
									}));
								}}
							/>
						</ListRow>
						<ListRow>
							<Switch
								value={restoreAccountDetail?.dataSource}
								label={t('label.restore_data_source', 'Restore Data Source')}
								onClick={(): void => {
									setRestoreAccountDetail((prev: any) => ({
										...prev,
										dataSource: !restoreAccountDetail?.dataSource
									}));
								}}
							/>
						</ListRow>
						<ListRow>
							<Switch
								value={restoreAccountDetail?.isEmailNotificationEnable}
								label={t('label.email_notification', 'E-mail Notifications')}
								onClick={(): void => {
									setRestoreAccountDetail((prev: any) => ({
										...prev,
										isEmailNotificationEnable: !restoreAccountDetail?.isEmailNotificationEnable
									}));
								}}
							/>
						</ListRow>
						<ListRow>
							<Input
								value={restoreAccountDetail?.notificationReceiver}
								backgroundColor="gray5"
								label={t('label.who_needs_receive_this_email', 'Who needs to receive this email?')}
								onChange={(e: any): void => {
									setRestoreAccountDetail((prev: any) => ({
										...prev,
										notificationReceiver: e.target.value
									}));
								}}
							/>
						</ListRow>
					</Row>
				</Container>
			</Row>
		</Container>
	);
};
export default RestoreDeleteAccountConfigSection;
