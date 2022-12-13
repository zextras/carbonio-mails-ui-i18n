/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useEffect, useMemo, useState } from 'react';
import { Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useUserAccounts } from '@zextras/carbonio-shell-ui';
import packageJson from '../../../package.json';
import MatomoTracker from '../../matomo-tracker';
import { DASHBOARD } from '../../constants';
import { useGlobalConfigStore } from '../../store/global-config/store';
import ListRow from '../list/list-row';
import CarbonioVersionInformation from './carbonio-version-information-view';
import QuickAccess from './quick-access-view';
import DashboardNotification from './dashboard-notification';
import DashboardServerList from './dashboard-server-list-view';

const Dashboard: FC = () => {
	const [t] = useTranslation();
	const matomo = useMemo(() => new MatomoTracker(), []);
	const globalCarbonioSendAnalytics = useGlobalConfigStore(
		(state) => state.globalCarbonioSendAnalytics
	);
	const accounts = useUserAccounts();
	const [userName, setUserName] = useState<string>('');
	const [version, setVersion] = useState<string>('');
	const [quickAccessItems, setQuickAccessItems] = useState<Array<any>>([
		{
			upperText: t('label.domains', 'Domains'),
			operationText: t('label.accounts', 'Accounts'),
			bottomText: t('label.open', 'Open'),
			operationIcon: 'PersonOutline',
			bottomIcon: 'ChevronRightOutline',
			bgColor: 'avatar_39'
		},
		{
			upperText: t('label.domains', 'Domains'),
			operationText: t('label.mailing_list', 'Mailing List'),
			bottomText: t('label.open', 'Open'),
			operationIcon: 'PersonOutline',
			bottomIcon: 'ChevronRightOutline',
			bgColor: 'avatar_21'
		}
	]);

	useEffect(() => {
		globalCarbonioSendAnalytics && matomo.trackPageView(`${DASHBOARD}`);
	}, [globalCarbonioSendAnalytics, matomo]);

	useEffect(() => {
		if (accounts[0]?.displayName) {
			setUserName(accounts[0]?.displayName);
		} else if (accounts[0]?.name) {
			setUserName(accounts[0]?.name.split('@')[0]);
		}
	}, [accounts]);

	useEffect(() => {
		if (packageJson?.version) {
			setVersion(packageJson?.version);
		}
	}, []);

	return (
		<Container
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			background="gray5"
			style={{ overflow: 'auto' }}
			height="calc(100vh - 120px)"
		>
			<ListRow>
				<Container width={'40'} padding={{ all: 'extralarge' }}>
					<CarbonioVersionInformation userName={userName} />
				</Container>
				<Container width={'60'} padding={{ all: 'extralarge' }}>
					<QuickAccess quickAccessItems={quickAccessItems} />
				</Container>
			</ListRow>

			<ListRow>
				<Container padding={{ all: 'extralarge' }}>
					<DashboardNotification />
				</Container>
			</ListRow>

			<ListRow>
				<Container padding={{ all: 'extralarge' }}>
					<DashboardServerList />
				</Container>
			</ListRow>
		</Container>
	);
};
export default Dashboard;
