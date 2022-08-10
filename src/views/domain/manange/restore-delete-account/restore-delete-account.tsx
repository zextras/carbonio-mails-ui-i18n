/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useState } from 'react';
import { Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import RestoreAccountWizard from './restore-delete-account-wizard';
import { useGlobalConfigStore } from '../../../../store/global-config/store';

const RestoreDeleteAccount: FC = () => {
	const [t] = useTranslation();
	const [showRestoreAccountWizard, setShowRestoreAccountWizard] = useState<boolean>(false);
	const restoreAccountRequest = useCallback((name, id, createDate, status, copyAccount) => {
		console.log('xxxx: ', name);
		console.log('xxxx: ', id);
		console.log('xxxx: ', createDate);
		console.log('xxxx: ', status);
		console.log('xxxx: ', copyAccount);
	}, []);

	const getGlobalConfig = useGlobalConfigStore((state) => state.globalConfig);
	useEffect(() => {
		console.log('$$$$$$$ ', getGlobalConfig);
	}, [getGlobalConfig]);
	return (
		<Container background="gray5" mainAlignment="flex-start">
			<Container
				orientation="column"
				background="gray5"
				crossAlignment="flex-start"
				mainAlignment="flex-start"
			>
				<Container
					orientation="column"
					background="gray6"
					crossAlignment="flex-start"
					mainAlignment="flex-start"
					height="calc(100% - 70px)"
					style={{ overflow: 'auto' }}
				>
					<RestoreAccountWizard
						setShowRestoreAccountWizard={setShowRestoreAccountWizard}
						restoreAccountRequest={restoreAccountRequest}
					/>
				</Container>
			</Container>
		</Container>
	);
};
export default RestoreDeleteAccount;
