/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Row, Text, Divider, Button } from '@zextras/carbonio-design-system';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { OperationsTable } from './operations-table';
import { OperationsHeader } from '../utility/utils';
import { AbsoluteContainer } from '../components/styled';
import OperationsWizardDetailPanel from './operations-wizard-detail-panel';
import DeleteOpearationsModel from './delete-operations-model';
import { useOperationStore } from '../../store/operation/store';
import { stopOperations } from '../../services/stop-operation';

const RelativeContainer = styled(Container)`
	position: relative;
`;

const RunningDetailPanel: FC<{ getAllOperationAPICallHandler: any }> = ({
	getAllOperationAPICallHandler
}) => {
	const [t] = useTranslation();
	const { runningData } = useOperationStore((state) => state);
	const operationsHeader = useMemo(() => OperationsHeader(t), [t]);
	const [wizardDetailToggle, setWizardDetailToggle] = useState(false);
	const [open, setOpen] = useState(false);
	const [selectedData, setSelectedData] = useState<any>();
	// console.log('__runningData', runningData);

	const closeHandler = (): any => {
		setOpen(false);
	};

	const stopHandler = (modelHandler: boolean): any => {
		if (!modelHandler) {
			stopOperations(selectedData?.id)
				.then((res) => {
					if (res.ok) {
						setOpen(false);
						setWizardDetailToggle(false);
						getAllOperationAPICallHandler();
					}
				})
				.catch((err) => {
					console.log('_err', err);
				});
		}
	};

	const handleClick = (i: any): any => {
		const volumeObject: any = runningData.find((s: any, index: any) => index === i);
		setSelectedData(volumeObject);
		setWizardDetailToggle(true);
	};

	const handleStopAllOperation = (): any => {
		console.log('__stopAllOperation');
	};

	// const allOperations = useCallback(() => {
	// 	const res =
	// 		'{"response":{"np-s01.demo.zextras.io":{"response":{"operationList":[{"startTime":1672218757532,"module":"ZxBackup","name":"SmartScan","descName":"Smart Scan","id":"45cd85f0-04b1-461c-8bb0-7f0ddb0a19c5","state":"Started","host":"np-s01.demo.zextras.io","parameters":{"requesterAddress":"zimbra","additionalNotificationAddresses":[],"origin":"ZxLink","isDeep":true,"createFakeBlob":false},"monitorCommand":"carbonio backup monitor 45cd85f0-04b1-461c-8bb0-7f0ddb0a19c5","queuedTime":1672218757532}],"realTimeScanOperations":0},"ok":true}},"nested":true,"ok":true}';
	// 	const result = JSON.parse(res);
	// 	console.log('__Res', result);

	// 	setOperationData(result?.response?.[`${serverList}`]?.response?.operationList);
	// 	// getAllOperations().then((response: any) => {
	// 	// 	console.log('__res', response);
	// 	// });
	// }, [serverList]);

	// useEffect(() => {
	// 	allOperations();
	// }, [allOperations]);

	return (
		<>
			{wizardDetailToggle && (
				<AbsoluteContainer orientation="vertical" background="gray5">
					<OperationsWizardDetailPanel
						setWizardDetailToggle={setWizardDetailToggle}
						operation="Operation#2"
						server={runningData[0]?.host}
						setOpen={setOpen}
						selectedData={selectedData}
					/>
				</AbsoluteContainer>
			)}
			<RelativeContainer
				orientation="column"
				crossAlignment="flex-start"
				mainAlignment="flex-start"
				style={{ overflowY: 'auto' }}
				background="white"
			>
				<DeleteOpearationsModel
					open={open}
					closeHandler={closeHandler}
					saveHandler={stopHandler}
					operationMessage={'You are stopping OperationName'}
					modelHandler={false}
				/>
				<Row mainAlignment="flex-start" padding={{ all: 'large' }}>
					<Text size="extralarge" weight="bold">
						{t('operations.running_panel_heading', 'Running Operations')}
					</Text>
				</Row>
				<Divider />
				<Container
					orientation="column"
					crossAlignment="flex-start"
					mainAlignment="flex-start"
					width="100%"
					height="calc(100vh - 200px)"
					padding={{ all: 'large' }}
				>
					<Row takeAvwidth="fill" mainAlignment="flex-end" crossAlignment="flex-end" width="100%">
						<Button
							type="outlined"
							label={t('operations.stop_opearation_btn', 'STOP OPERATION')}
							color="error"
							icon="StopCircleOutline"
							iconPlacement="right"
							onClick={handleStopAllOperation}
						/>
					</Row>
					<Row width="100%" padding={{ top: 'large' }}>
						{runningData && (
							<OperationsTable
								operations={runningData}
								headers={operationsHeader}
								donePanel={false}
								selectedRows=""
								onSelectionChange={(selected: any): any => {
									console.log('__selected', selected);
								}}
								onClick={(i: any): any => {
									handleClick(i);
								}}
							/>
						)}
					</Row>
				</Container>
			</RelativeContainer>
		</>
	);
};

export default RunningDetailPanel;
