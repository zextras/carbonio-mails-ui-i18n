/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';
import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

const CarbonioVersionInformation: FC<{
	userName: string;
}> = ({ userName }) => {
	const [t] = useTranslation();
	return (
		<Container
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			padding={{ all: 'extralarge' }}
		>
			<Text
				color="secondary"
				overflow="break-word"
				weight="light"
				size="large"
				style={{ fontSize: '36px', fontFamily: 'roboto' }}
			>
				{t('welcome_to_carbonio_information', {
					adminName: userName,
					defaultValue: 'Welcome {{adminName}} to Carbonio!'
				})}
			</Text>
		</Container>
	);
};

export default CarbonioVersionInformation;
