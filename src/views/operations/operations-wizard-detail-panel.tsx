/* eslint-disable no-shadow */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useState } from 'react';
import {
	Container,
	Input,
	Row,
	IconButton,
	Divider,
	Padding,
	Button,
	Text
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import ListRow from '../list/list-row';
import MiliSecondToDate from './functions/miliSecondToDate';
import {
	DONE_ROUTE_ID,
	FALSE_OPERTION,
	QUEUED,
	RUNNING_ROUTE_ID,
	STARTED,
	STOPPING,
	TRUE_OPERTION
} from '../../constants';

const OperationsWizardDetailPanel: FC<{
	setWizardDetailToggle: any;
	operation: string;
	server: string;
	setOpen: any;
	selectedData: any;
}> = ({ setWizardDetailToggle, server, operation, setOpen, selectedData }) => {
	const [t] = useTranslation();
	const [status, setStatus] = useState('');
	console.log('__data', selectedData);

	useEffect(() => {
		if (selectedData?.state === STARTED) {
			setStatus(RUNNING_ROUTE_ID.charAt(0).toUpperCase() + RUNNING_ROUTE_ID.slice(1));
		} else if (selectedData?.state === QUEUED) {
			setStatus(QUEUED);
		} else {
			setStatus(DONE_ROUTE_ID.charAt(0).toUpperCase() + DONE_ROUTE_ID.slice(1));
		}
	}, [selectedData?.state]);

	return (
		<Container background="gray6">
			<Row mainAlignment="flex-start" crossAlignment="center" width="100%" height="auto">
				<Row mainAlignment="flex-start" padding={{ all: 'large' }} takeAvailableSpace>
					<Text size="extralarge" weight="bold">
						{`${operation} on ${selectedData?.host}`}
					</Text>
				</Row>
				<Row padding={{ horizontal: 'small' }}>
					<IconButton
						icon="CloseOutline"
						color="gray1"
						onClick={(): void => setWizardDetailToggle(false)}
					/>
				</Row>
			</Row>
			<Divider />
			<Container padding={{ all: 'large' }} mainAlignment="flex-start" crossAlignment="flex-start">
				<Row
					takeAvwidth="fill"
					mainAlignment="flex-end"
					crossAlignment="flex-end"
					width="100%"
					padding={{ vertical: 'large' }}
				>
					<Padding right="large">
						<Button
							type="outlined"
							label={t('operations.copy_btn', 'COPY')}
							color="primary"
							icon="CopyOutline"
							iconPlacement="right"
						/>
					</Padding>
					{selectedData?.state !== STOPPING && (
						<Button
							type="outlined"
							label={
								selectedData?.state === STARTED
									? t('operations.stop_opearation_btn', 'STOP OPERATION')
									: t('operations.cancel_opearation_btn', 'CANCEL OPERATION')
							}
							color="error"
							icon={selectedData?.state === STARTED ? 'StopCircleOutline' : 'Close'}
							iconPlacement="right"
							onClick={(): void => setOpen(true)}
						/>
					)}
				</Row>
				<Row mainAlignment="flex-start" padding={{ vertical: 'large' }} width="100%">
					<Text size="medium" color="gray0" weight="bold">
						{t('operations.details', 'Details')}
					</Text>
					<Row width="100%" padding={{ top: 'large' }}>
						<ListRow>
							<Container padding={{ right: 'small' }}>
								<Input
									background="gray6"
									label={t('operations.label.operation_type', 'Operation Type')}
									value="Backup"
									readOnly
								/>
							</Container>
							<Container padding={{ right: 'small', left: 'small' }}>
								<Input
									background="gray6"
									label={t('operations.label.who_started_it', 'Who started it?')}
									value={selectedData?.parameters?.requesterAddress}
									readOnly
								/>
							</Container>
							<Container padding={{ left: 'small' }}>
								<Input
									background="gray6"
									label={t('operations.label.status', 'Status')}
									value={status}
									readOnly
								/>
							</Container>
						</ListRow>
					</Row>
					<Row width="100%" padding={{ top: 'large' }}>
						<ListRow>
							<Container padding={{ right: 'small' }}>
								<Input
									background="gray6"
									label={t('operations.label.submitted_at', 'Submitted at')}
									value={MiliSecondToDate(selectedData?.startTime)}
									readOnly
								/>
							</Container>
							<Container padding={{ left: 'small' }}>
								<Input
									background="gray6"
									label={t('operations.label.started_at', 'Started at')}
									value={MiliSecondToDate(selectedData?.queuedTime)}
									readOnly
								/>
							</Container>
						</ListRow>
					</Row>
				</Row>
				<Padding vertical="large" />
				<Divider />
				<Padding vertical="large" />
				<Row mainAlignment="flex-start" padding={{ vertical: 'large' }} width="100%">
					<Text size="medium" color="gray0" weight="bold">
						{t('operations.other', 'Other')}
					</Text>
					<Row width="100%" padding={{ top: 'large' }}>
						<ListRow>
							<Container padding={{ right: 'small' }}>
								<Input
									background="gray6"
									label={t('operations.label.action(M)', 'Action (M)')}
									value="Start"
									readOnly
								/>
							</Container>
							<Container padding={{ right: 'small', left: 'small' }}>
								<Input
									background="gray6"
									label={t('operations.label.notifications', 'Notifications')}
									value={selectedData?.parameters?.additionalNotificationAddresses?.length}
									readOnly
								/>
							</Container>
							<Container padding={{ left: 'small' }}>
								<Input
									background="gray6"
									label={t('operations.label.read_error_threshold', 'Read Error Threshold')}
									value="0"
									readOnly
								/>
							</Container>
						</ListRow>
					</Row>
					<Row width="100%" padding={{ top: 'large' }}>
						<ListRow>
							<Container padding={{ right: 'small' }}>
								<Input
									background="gray6"
									label={t('operations.label.remote_metadata_upload', 'Remote Metadata Upload')}
									value="False"
									readOnly
								/>
							</Container>
							<Container padding={{ right: 'small', left: 'small' }}>
								<Input
									background="gray6"
									label={t('operations.label.create_fake_blob', 'Create Fake Blob')}
									value={selectedData?.parameters?.createFakeBlob ? TRUE_OPERTION : FALSE_OPERTION}
									readOnly
								/>
							</Container>
							<Container padding={{ left: 'small' }}>
								<Input
									background="gray6"
									label={t('operations.label.Deep', 'Deep')}
									value={selectedData?.parameters?.isDeep ? TRUE_OPERTION : FALSE_OPERTION}
									readOnly
								/>
							</Container>
						</ListRow>
					</Row>
				</Row>
			</Container>
		</Container>
	);
};

export default OperationsWizardDetailPanel;
