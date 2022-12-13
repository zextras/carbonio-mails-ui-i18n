/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';
import { Container, Text, Icon, Divider } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import ListRow from '../list/list-row';

export const ActionContainer = styled(Container)`
	background: ${({ theme, bgColor }): string => theme.avatarColors[bgColor]};
	border-radius: 0.5rem;
`;

const QuickAccess: FC<{
	quickAccessItems: Array<any>;
}> = ({ quickAccessItems }) => {
	const [t] = useTranslation();
	return (
		<Container
			background="gray6"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			padding={{ all: 'extralarge' }}
			style={{ 'border-radius': '0.5rem' }}
		>
			<Container padding={{ all: 'large' }} mainAlignment="flex-start" crossAlignment="flex-start">
				<ListRow>
					<Container mainAlignment="flex-start" crossAlignment="flex-start" width="2rem">
						<Icon icon="FlashOutline" height={'1.5rem'} width="1.5rem" />
					</Container>
					<Container mainAlignment="flex-start" crossAlignment="flex-start">
						{t('dashboard.quick_access_default_domain', 'Quick Access to {defaultDomain}')}
					</Container>
				</ListRow>
			</Container>
			<Container
				orientation="horizontal"
				mainAlignment="space-between"
				crossAlignment="flex-start"
				padding={{ top: 'extralarge' }}
			>
				{quickAccessItems.map((item) => (
					<>
						<Container
							mainAlignment="flex-start"
							crossAlignment="flex-start"
							padding={{ left: 'extralarge' }}
						>
							<ActionContainer
								height={'8.75rem'}
								mainAlignment="flex-start"
								crossAlignment="flex-start"
								width={'21.75rem'}
								bgColor={item?.bgColor}
							>
								<ListRow>
									<Container padding={{ all: 'large' }}>
										<Container mainAlignment="flex-start" crossAlignment="flex-start">
											<Text color="gray6" overflow="break-word" weight="light" size="medium">
												{item?.upperText}
											</Text>
										</Container>
										<Container
											mainAlignment="flex-start"
											crossAlignment="flex-start"
											padding={{ top: 'extrasmall' }}
										>
											<Text color="gray6" overflow="break-word" weight="bold" size="large">
												{item?.operationText}
											</Text>
										</Container>
									</Container>
									<Container crossAlignment="flex-end" padding={{ right: 'large' }}>
										<Icon color="gray6" icon={item?.operationIcon} height="2rem" width="2rem" />
									</Container>
								</ListRow>
								<ListRow>
									<Container padding={{ left: 'large', right: 'large' }}>
										<Divider />
									</Container>
								</ListRow>
								<ListRow>
									<Container
										mainAlignment="flex-start"
										crossAlignment="flex-start"
										padding={{ all: 'large' }}
									>
										<Text color="gray6" overflow="break-word" weight="light" size="medium">
											{item?.bottomText}
										</Text>
									</Container>
									<Container
										mainAlignment="flex-end"
										crossAlignment="flex-end"
										padding={{ all: 'large' }}
									>
										<Icon icon={item?.bottomIcon} size="medium" color="gray6" />
									</Container>
								</ListRow>
							</ActionContainer>
						</Container>
					</>
				))}
			</Container>
		</Container>
	);
};

export default QuickAccess;
