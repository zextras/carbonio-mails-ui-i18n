/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Container,
	DefaultTabBarItem,
	Text,
	TabBar,
	SnackbarManagerContext,
	Table,
	Icon,
	Button,
	Padding
} from '@zextras/carbonio-design-system';
import React, {
	FC,
	ReactElement,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState
} from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import {
	ERROR,
	NOTIFICATION_ALL,
	NOTIFICATION_ERROR,
	NOTIFICATION_INFORMATION,
	NOTIFICATION_WARNING
} from '../../../constants';
import { getAllNotifications } from '../../../services/get-all-notifications';
import ListRow from '../../list/list-row';

const ReusedDefaultTabBar: FC<{
	item: any;
	index: any;
	selected: any;
	onClick: any;
}> = ({ item, index, selected, onClick }): ReactElement => (
	<DefaultTabBarItem
		item={item}
		index={index}
		selected={selected}
		onClick={onClick}
		orientation="horizontal"
	>
		<ListRow>
			<Container
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				width="2rem"
				padding={{ all: 'medium' }}
			>
				<Icon icon={item?.icon} height={'1rem'} width="1rem" />
			</Container>
			<Container mainAlignment="flex-start" crossAlignment="flex-start" padding={{ all: 'medium' }}>
				<Text size="small" weight="regular" color={selected ? 'primary' : 'gray'}>
					{item.label}
				</Text>
			</Container>
		</ListRow>
	</DefaultTabBarItem>
);

export type Notification = {
	ack: boolean;
	date: number;
	group: string;
	id: string;
	level: string;
	operationId: string;
	server: string;
	subject: string;
	text: string;
};

const NotificationView: FC<{
	isShowTitle: boolean;
}> = ({ isShowTitle }) => {
	const [t] = useTranslation();
	const [change, setChange] = useState(NOTIFICATION_ALL);
	const [click, setClick] = useState('');
	const createSnackbar: any = useContext(SnackbarManagerContext);
	const [notificationList, setNotificationList] = useState<Array<Notification>>([]);
	const [filterdNotification, setFilterdNotification] = useState<Array<Notification>>([]);
	const [notificationRows, setNotificationRows] = useState<Array<any>>([]);

	const items = [
		{
			id: NOTIFICATION_ALL,
			icon: 'KeypadOutline',
			label: t('notification.all', 'ALL'),
			CustomComponent: ReusedDefaultTabBar
		},
		{
			id: NOTIFICATION_INFORMATION,
			icon: 'InfoOutline',
			label: t('notification.information', 'INFORMATION'),
			CustomComponent: ReusedDefaultTabBar
		},
		{
			id: NOTIFICATION_WARNING,
			icon: 'AlertTriangleOutline',
			label: t('notification.warning', 'WARNING'),
			CustomComponent: ReusedDefaultTabBar
		},
		{
			id: NOTIFICATION_ERROR,
			icon: 'CloseCircleOutline',
			label: t('notification.error', 'ERROR'),
			CustomComponent: ReusedDefaultTabBar
		}
	];

	const headers: any[] = useMemo(
		() => [
			{
				id: 'server',
				label: t('label.server', 'Server'),
				width: '20%',
				bold: true
			},
			{
				id: 'date',
				label: t('label.date', 'Date'),
				width: '20%',
				bold: true
			},
			{
				id: 'type',
				label: t('label.type', 'Type'),
				width: '20%',
				bold: true
			},
			{
				id: 'whatinside',
				label: t('label.what_inside', 'What’s inside?'),
				width: '40%',
				bold: true
			}
		],
		[t]
	);

	const allNotifications = useCallback(() => {
		getAllNotifications()
			.then((res) => {
				if (res?.Body?.response?.content) {
					const content = JSON.parse(res?.Body?.response?.content);
					if (content?.response) {
						// eslint-disable-next-line array-callback-return
						Object.keys(content?.response).map((ele: any) => {
							if (content?.response[ele] && content?.response[ele]?.response?.notifications) {
								setNotificationList(content?.response[ele]?.response?.notifications);
							}
						});
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
		allNotifications();
	}, [allNotifications]);

	useEffect(() => {
		if (notificationList.length > 0) {
			if (change === NOTIFICATION_ALL) {
				setFilterdNotification(notificationList);
			} else if (change === NOTIFICATION_INFORMATION) {
				const list = notificationList.filter(
					(item: Notification) => item?.level === NOTIFICATION_INFORMATION
				);
				setFilterdNotification(list);
			} else if (change === NOTIFICATION_WARNING) {
				const list = notificationList.filter(
					(item: Notification) => item?.level === NOTIFICATION_WARNING
				);
				setFilterdNotification(list);
			} else if (change === ERROR) {
				const list = notificationList.filter(
					(item: Notification) => item?.level === NOTIFICATION_ERROR
				);
				setFilterdNotification(list);
			}
		}
	}, [change, notificationList]);

	useEffect(() => {
		if (filterdNotification.length > 0) {
			const allRows = filterdNotification.map((item: Notification) => ({
				id: item?.id,
				columns: [
					<Text
						size="small"
						color="gray0"
						weight="bold"
						key={item}
						onClick={(event: { stopPropagation: () => void }): void => {
							event.stopPropagation();
						}}
					>
						{item?.server}
					</Text>,
					<Text
						size="small"
						color="gray0"
						weight="bold"
						key={item}
						onClick={(event: { stopPropagation: () => void }): void => {
							event.stopPropagation();
						}}
					>
						{moment(item?.date).format('DD-MM-YYYY - HH:mm A')}
					</Text>,
					<Text
						size="small"
						weight="bold"
						color="gray0"
						key={item}
						onClick={(event: { stopPropagation: () => void }): void => {
							event.stopPropagation();
						}}
					>
						{item?.level}
					</Text>,
					<Text
						size="small"
						weight="bold"
						color="gray0"
						key={item}
						onClick={(event: { stopPropagation: () => void }): void => {
							event.stopPropagation();
						}}
					>
						{item?.text}
					</Text>
				]
			}));
			setNotificationRows(allRows);
		} else {
			setNotificationRows([]);
		}
	}, [filterdNotification]);

	return (
		<Container background="gray6">
			<ListRow>
				<Container mainAlignment="flex-start" crossAlignment="flex-start">
					{isShowTitle && (
						<Text size="large" weight="bold" color="gray0">
							{t('notification.notifications_list', 'Notifications’ List')}
						</Text>
					)}
				</Container>
				<Container mainAlignment="flex-end" crossAlignment="flex-end">
					<TabBar
						items={items}
						defaultSelected={NOTIFICATION_ALL}
						onChange={setChange}
						onItemClick={setClick}
					/>
				</Container>
			</ListRow>
			<ListRow>
				<Container
					mainAlignment="flex-end"
					crossAlignment="flex-end"
					orientation="horizontal"
					padding={{ all: 'extralarge' }}
				>
					<Button
						type="ghost"
						label={t('notification.copy', 'Copy')}
						icon="CopyOutline"
						iconPlacement="right"
						color="secondary"
					/>
					<Padding left="large">
						<Button
							type="outlined"
							label={t('notification.mark_as_read', 'Mark as read')}
							icon="EmailReadOutline"
							iconPlacement="right"
							color="primary"
						/>
					</Padding>
				</Container>
			</ListRow>
			<ListRow>
				<Container
					orientation="horizontal"
					mainAlignment="space-between"
					crossAlignment="flex-start"
					width="fill"
					height="calc(100vh - 340px)"
				>
					<Table
						rows={notificationRows}
						headers={headers}
						showCheckbox={false}
						multiSelect={false}
						style={{ overflow: 'auto', height: '100%' }}
					/>
				</Container>
			</ListRow>
		</Container>
	);
};

export default NotificationView;
