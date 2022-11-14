/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
	Container,
	Divider,
	Row,
	Text,
	Button,
	Input,
	Padding,
	Table,
	Icon,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { useTranslation, Trans } from 'react-i18next';
import moment from 'moment';
import gardian from '../../../../assets/gardian.svg';
import { getAllDevices } from '../../../../services/get-all-devices';
import ActiveDeviceDetail from './active-device-detail';
import { ZX_MOBILE } from '../../../../constants';

type MobileDevice = {
	accountEmail: string;
	accountName: string;
	accountServer: string;
	deviceId: string;
	deviceType: string;
	firstSeen: number;
	hasMobilePassword: boolean;
	isOnline: boolean;
	lastCommandReceived: number;
	lastPingTimeoutSecs: number;
	lastSeen: number;
	protocolVersion: string;
	provisionable: boolean;
	status: number;
	userAgent: string;
};

const ActiveSync: FC = () => {
	const [t] = useTranslation();
	const [offset, setOffset] = useState<number>(0);
	const [allMobileDevices, setAllMobileDevices] = useState<Array<MobileDevice>>([]);
	const [allDeviceRow, setAllDeviceRow] = useState<Array<any>>([]);
	const createSnackbar: any = useContext(SnackbarManagerContext);
	const [isShowDeviceDetail, setIsShowDeviceDetail] = useState<boolean>(false);
	const [selectedMobileDevice, setSelectedMobileDevice] = useState<Array<any>>([]);
	const [selectedMobileDeviceDetail, setSelectedMobileDeviceDetail] = useState<any>();
	const headers: any[] = useMemo(
		() => [
			{
				id: 'name',
				label: t('label.device', 'Device'),
				width: '10%',
				bold: true
			},
			{
				id: 'device_id',
				label: t('label.device_id', 'Device ID'),
				width: '15%',
				bold: true
			},
			{
				id: 'account',
				label: t('label.account', 'Account'),
				width: '15%',
				bold: true
			},
			{
				id: 'last_seen',
				label: t('label.last_seen', 'Last seen'),
				width: '20%',
				bold: true
			},
			{
				id: 'eas',
				label: t('label.eas', 'EAS'),
				width: '15%',
				bold: true
			},
			{
				id: 'status',
				label: t('label.status', 'Status'),
				width: '15%',
				bold: true
			}
		],
		[t]
	);

	const getAllDeviceList = useCallback(() => {
		getAllDevices(ZX_MOBILE)
			.then((res: any) => {
				if (res?.Body?.response?.content) {
					const content = JSON.parse(res?.Body?.response?.content);
					if (content?.response?.devices && content?.ok) {
						const devices = content?.response?.devices;
						if (devices && devices.length > 0) {
							setAllMobileDevices(devices);
						}
					}
				}
			})
			.catch((error: any) => {
				createSnackbar({
					key: 'error',
					type: 'error',
					label: error
						? error?.error
						: t('label.something_wrong_error_msg', 'Something went wrong. Please try again.'),
					autoHideTimeout: 3000,
					hideButton: true,
					replace: true
				});
			});
	}, [t, createSnackbar]);

	useEffect(() => {
		getAllDeviceList();
	}, [getAllDeviceList]);

	useEffect(() => {
		if (allMobileDevices.length > 0) {
			const allRows = allMobileDevices.map((item: MobileDevice) => ({
				id: item?.firstSeen,
				columns: [
					<Text size="medium" weight="bold" key={item}>
						{item?.accountName}
					</Text>,
					<Text size="medium" weight="bold" key={item}>
						{item?.deviceId}
					</Text>,
					<Text size="medium" weight="bold" key={item}>
						{item?.accountEmail}
					</Text>,
					<Text size="medium" weight="bold" key={item}>
						{moment(item?.lastSeen).format('YY/MM/DD | hh:mm:ss a')}
					</Text>,
					<Text size="medium" weight="bold" key={item}>
						{''}
					</Text>,
					<Text size="medium" weight="bold" key={item}>
						{item?.status === 1 ? t('label.enabled', 'Enabled') : t('label.disabled', 'Disabled')}
					</Text>
				]
			}));
			setAllDeviceRow(allRows);
		} else {
			setAllDeviceRow([]);
		}
	}, [allMobileDevices, t]);

	useEffect(() => {
		if (selectedMobileDevice.length > 0) {
			const mobileDevice = allMobileDevices.find(
				(item: MobileDevice) => item?.firstSeen === selectedMobileDevice[0]
			);
			if (mobileDevice) {
				setSelectedMobileDeviceDetail(mobileDevice);
				setIsShowDeviceDetail(true);
			}
		}
	}, [selectedMobileDevice, allMobileDevices]);

	return (
		<Container background="gray6" mainAlignment="flex-start">
			<Container
				orientation="column"
				background="gray6"
				crossAlignment="flex-start"
				mainAlignment="flex-start"
			>
				<Row takeAvwidth="fill" mainAlignment="flex-start" width="100%">
					<Container orientation="vertical" mainAlignment="space-around" height="56px">
						<Row orientation="horizontal" width="100%">
							<Row
								padding={{ all: 'large' }}
								mainAlignment="flex-start"
								width="50%"
								crossAlignment="flex-start"
							>
								<Text size="medium" weight="bold" color="gray0">
									{t('label.active_sync', 'ActiveSync')}
								</Text>
							</Row>
							<Row
								padding={{ all: 'large' }}
								width="50%"
								mainAlignment="flex-end"
								crossAlignment="flex-end"
							>
								<Button
									type="outlined"
									label={t('label.bulk_actions', 'Bulk Actions')}
									icon="ArrowIosDownward"
									iconPlacement="right"
									color="primary"
									disabled
									height={36}
								/>
							</Row>
						</Row>
					</Container>
					<Divider color="gray2" />
				</Row>
				<Container
					orientation="column"
					background="gray6"
					crossAlignment="flex-start"
					mainAlignment="flex-start"
					height="calc(100% - 70px)"
					style={{ overflow: 'auto' }}
					padding={{ all: 'large' }}
				>
					<Row takeAvwidth="fill" mainAlignment="flex-start" width="100%" wrap="nowrap">
						<Input
							label={t(
								'label.filter_by_device_type_account',
								'Filter by device type, account, status'
							)}
							background="gray5"
							value={''}
							CustomIcon={(): any => <Icon icon="FunnelOutline" size="large" color="primary" />}
						/>

						<Padding left="medium">
							<Button
								type="outlined"
								label={t('label.remove', 'Remove')}
								color="error"
								height="44px"
							/>
						</Padding>
					</Row>
					<Row
						takeAvwidth="fill"
						mainAlignment="flex-start"
						width="100%"
						wrap="nowrap"
						padding={{ top: 'large' }}
					>
						<Table
							rows={allDeviceRow}
							headers={headers}
							showCheckbox={false}
							multiSelect={false}
							onSelectionChange={(selected: any): void => setSelectedMobileDevice(selected)}
						/>
					</Row>
					{allDeviceRow.length === 0 && (
						<Container orientation="column" crossAlignment="center" mainAlignment="center">
							<Row>
								<img src={gardian} alt="logo" />
							</Row>
							<Row
								padding={{ top: 'extralarge' }}
								orientation="vertical"
								crossAlignment="center"
								style={{ textAlign: 'center' }}
							>
								<Text weight="light" color="#828282" size="large" overflow="break-word">
									{t('label.this_list_is_empty', 'This list is empty.')}
								</Text>
							</Row>
							<Row
								orientation="vertical"
								crossAlignment="center"
								style={{ textAlign: 'center' }}
								padding={{ top: 'small' }}
								width="53%"
							>
								<Text weight="light" color="#828282" size="large" overflow="break-word">
									<Trans
										i18nKey="label.do_you_need_more_information"
										defaults="Do you need more information?"
									/>
								</Text>
							</Row>
							<Row
								orientation="vertical"
								crossAlignment="center"
								style={{ textAlign: 'center' }}
								padding={{ top: 'small', bottom: 'small' }}
								width="53%"
							>
								<Text weight="light" color="primary">
									{t('label.click_here', 'Click here')}
								</Text>
							</Row>
						</Container>
					)}
					{/* <Row
						takeAvwidth="fill"
						mainAlignment="flex-start"
						width="100%"
						wrap="nowrap"
						padding={{ top: 'large' }}
					>
						<Paginig totalItem={1} pageSize={10} setOffset={setOffset} />
					</Row> */}
				</Container>
			</Container>
			{isShowDeviceDetail && (
				<ActiveDeviceDetail
					setIsShowDeviceDetail={setIsShowDeviceDetail}
					selectedMobileDeviceDetail={selectedMobileDeviceDetail}
				/>
			)}
		</Container>
	);
};
export default ActiveSync;
