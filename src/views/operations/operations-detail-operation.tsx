/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
	DONE_ROUTE_ID,
	QUEUED,
	QUEUED_ROUTE_ID,
	RUNNING_ROUTE_ID,
	STARTED,
	STOPPING
} from '../../constants';
import { useOperationStore } from '../../store/operation/store';
import { useServerStore } from '../../store/server/store';
import DoneDetailPanel from './done-detail-panel';
import QuededDetailPanel from './queued-detail-panel';
import RunningDetailPanel from './running-detail-panel';

const OperationsDetailOperation: FC = () => {
	const { operation }: { operation: string } = useParams();
	const serverList = useServerStore((state) => state.serverList)[0]?.name;
	const { setAlloperationDetail, setRunningData, setQueuedData, setDoneData } = useOperationStore(
		(state) => state
	);

	const getAllOperationAPICallHandler = useCallback(() => {
		console.log('__getCall');
		const res =
			'{"response":{"np-s01.demo.zextras.io":{"response":{"operationList":[{"startTime":1672218757532,"module":"ZxBackup","name":"SmartScan","descName":"Smart Scan","id":"45cd85f0-04b1-461c-8bb0-7f0ddb0a19c5","state":"Started","host":"np-s01.demo.zextras.io","parameters":{"requesterAddress":"zimbra","additionalNotificationAddresses":[],"origin":"ZxLink","isDeep":true,"createFakeBlob":false},"monitorCommand":"carbonio backup monitor 45cd85f0-04b1-461c-8bb0-7f0ddb0a19c5","queuedTime":1672218757532},{"startTime":1672218757532,"module":"ZxBackup","name":"SmartScan","descName":"Smart Scan","id":"45cd85f0-04b1-461c-8bb0-7f0ddb0a19c5","state":"Queued","host":"np-s01.demo.zextras.io","parameters":{"requesterAddress":"zimbra","additionalNotificationAddresses":[],"origin":"ZxLink","isDeep":true,"createFakeBlob":false},"monitorCommand":"carbonio backup monitor 45cd85f0-04b1-461c-8bb0-7f0ddb0a19c5","queuedTime":1672218757532},{"startTime":1672218757532,"module":"ZxBackup","name":"SmartScan","descName":"Smart Scan","id":"45cd85f0-04b1-461c-8bb0-7f0ddb0a19c5","state":"Stopping","host":"np-s01.demo.zextras.io","parameters":{"requesterAddress":"zimbra","additionalNotificationAddresses":[],"origin":"ZxLink","isDeep":true,"createFakeBlob":false},"monitorCommand":"carbonio backup monitor 45cd85f0-04b1-461c-8bb0-7f0ddb0a19c5","queuedTime":1672218757532}],"realTimeScanOperations":0},"ok":true}},"nested":true,"ok":true}';
		const result = JSON.parse(res)?.response?.[`${serverList}`]?.response?.operationList;
		setAlloperationDetail(result);
		const RunningOperationData = result?.filter((item: any) => item?.state === STARTED);
		setRunningData(RunningOperationData);
		const QueuedOperationData = result?.filter((item: any) => item?.state === QUEUED);
		setQueuedData(QueuedOperationData);
		const DoneOperationData = result?.filter((item: any) => item?.state === STOPPING);
		setDoneData(DoneOperationData);
	}, [serverList, setAlloperationDetail, setDoneData, setQueuedData, setRunningData]);

	useEffect(() => {
		getAllOperationAPICallHandler();
	}, [getAllOperationAPICallHandler]);

	return (
		<>
			{((): any => {
				switch (operation) {
					case RUNNING_ROUTE_ID:
						return (
							<RunningDetailPanel getAllOperationAPICallHandler={getAllOperationAPICallHandler} />
						);
					case QUEUED_ROUTE_ID:
						return (
							<QuededDetailPanel getAllOperationAPICallHandler={getAllOperationAPICallHandler} />
						);
					case DONE_ROUTE_ID:
						return <DoneDetailPanel />;
					default:
						return null;
				}
			})()}
		</>
	);
};

export default OperationsDetailOperation;
