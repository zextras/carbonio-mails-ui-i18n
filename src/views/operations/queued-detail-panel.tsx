/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo, useState } from 'react';
import { Container, Row, Text, Divider, Button } from '@zextras/carbonio-design-system';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { OperationsTable } from './operations-table';
import { OperationsHeader } from '../utility/utils';
import DeleteOpearationsModel from './delete-operations-model';
import OperationsWizardDetailPanel from './operations-wizard-detail-panel';
import { AbsoluteContainer } from '../components/styled';
import { useOperationStore } from '../../store/operation/store';
import { stopOperations } from '../../services/stop-operation';

const RelativeContainer = styled(Container)`
	position: relative;
`;

const QuededDetailPanel: FC<{ getAllOperationAPICallHandler: any }> = ({
	getAllOperationAPICallHandler
}) => {
	const [t] = useTranslation();
	const { queuedData } = useOperationStore((state) => state);
	const operationsHeader = useMemo(() => OperationsHeader(t), [t]);
	const [wizardDetailToggle, setWizardDetailToggle] = useState(false);
	const [open, setOpen] = useState(false);
	const [selectedData, setSelectedData] = useState<any>();
	console.log('__queuedData', queuedData);

	const closeHandler = (): any => {
		setOpen(false);
	};

	const stopHandler = (modelHandler: boolean): any => {
		console.log('__modelHandler', modelHandler);
		if (!modelHandler) {
			stopOperations(selectedData?.id)
				.then((res) => {
					console.log('__Res', res);
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
		const volumeObject: any = queuedData.find((s: any, index: any) => index === i);
		setSelectedData(volumeObject);
		setWizardDetailToggle(true);
	};

	return (
		<>
			{wizardDetailToggle && (
				<AbsoluteContainer orientation="vertical" background="gray5">
					<OperationsWizardDetailPanel
						setWizardDetailToggle={setWizardDetailToggle}
						operation="Operation#2"
						server="Server#2"
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
				<Row mainAlignment="flex-start" padding={{ all: 'large' }}>
					<Text size="extralarge" weight="bold">
						{t('operations.queued_panel_heading', 'Queued Operations')}
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
					<DeleteOpearationsModel
						open={open}
						closeHandler={closeHandler}
						saveHandler={stopHandler}
						operationMessage={'You are cancelling OperationName'}
						modelHandler
					/>
					<Row takeAvwidth="fill" mainAlignment="flex-end" crossAlignment="flex-end" width="100%">
						<Button
							type="outlined"
							label={t('operations.cancel_opearation_btn', 'CANCEL OPERATION')}
							color="error"
							icon="Close"
							iconPlacement="right"
							onClick={(): any => setWizardDetailToggle(!wizardDetailToggle)}
						/>
					</Row>
					<Row width="100%" padding={{ top: 'large' }}>
						{queuedData && (
							<OperationsTable
								operations={queuedData}
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

export default QuededDetailPanel;
