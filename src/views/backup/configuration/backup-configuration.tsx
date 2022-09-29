/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
	Container,
	Row,
	Text,
	Divider,
	Button,
	Switch,
	Input,
	SnackbarManagerContext,
	Padding
} from '@zextras/carbonio-design-system';
import {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	getSoapFetchRequest,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	postSoapFetchRequest,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	fetchExternalSoap
} from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';
import ListRow from '../../list/list-row';
import { useServerStore } from '../../../store/server/store';
import { updateBackup } from '../../../services/update-backup';
import { SERVER } from '../../../constants';
import { RouteLeavingGuard } from '../../ui-extras/nav-guard';

const BackupConfiguration: FC = () => {
	const { operation, server }: { operation: string; server: string } = useParams();
	const [t] = useTranslation();
	const allServers = useServerStore((state) => state.serverList);
	const createSnackbar: any = useContext(SnackbarManagerContext);
	const [moduleEnableStartup, setModuleEnableStartup] = useState<boolean>(false);
	const [enableRealtimeScanner, setEnableRealtimeScanner] = useState<boolean>(false);
	const [runSmartScanStartup, setRunSmartScanStartup] = useState<boolean>(false);
	const [spaceThreshold, setSpaceThreshold] = useState<number>(0);
	const [isScheduleSmartScan, setIsScheduleSmartScan] = useState<boolean>(false);
	const [scheduleSmartScan, setScheduleSmartScan] = useState<string>('');
	const [keepDeletedItemInBackup, setKeepDeletedItemInBackup] = useState<number>(0);
	const [keepDeletedAccountsInBackup, setKeepDeletedAccountsInBackup] = useState<number>(0);
	const [scheduleAutomaticRetentionPolicy, setScheduleAutomaticRetentionPolicy] =
		useState<boolean>(false);
	const [retentionPolicySchedule, setRetentionPolicySchedule] = useState<string>('');
	const [backupDestPath, setBackupDestPath] = useState<string>('');
	const [isDirty, setIsDirty] = useState<boolean>(false);
	const [isRequestInProgress, setIsRequestInProgress] = useState<boolean>(false);
	const [currentBackupValue, setCurrentBackupValue] = useState<any>({});
	const [backupServiceStart, setBackupServiceStart] = useState<boolean>(false);
	const [isBackupInitialized, setIsBackupInitialized] = useState<boolean>(false);
	const [isPurgeRequestRunning, setIsPurgeRequestRunning] = useState<boolean>(false);
	const [isExternalVolumeRequestRunning, setIsExternalVolumeRequestRunning] =
		useState<boolean>(false);
	const [isSaveRequestInProgress, setIsSaveRequestInProgress] = useState<boolean>(false);

	useEffect(() => {
		if (allServers && allServers.length > 0) {
			const selectedServer = allServers.find((serverItem: any) => serverItem?.name === server);
			const currentBackupObject: any = {};
			if (selectedServer && selectedServer?.id) {
				getSoapFetchRequest(
					`/service/extension/zextras_admin/core/getServer/${selectedServer?.id}?module=zxbackup`
				)
					.then((data: any) => {
						if (data && data?.attributes) {
							const attributes = data?.attributes;
							if (attributes?.ZxBackup_ModuleEnabledAtStartup) {
								const value = attributes?.ZxBackup_ModuleEnabledAtStartup?.value;
								if (value) {
									setModuleEnableStartup(value);
									currentBackupObject.moduleEnableStartup = true;
								} else {
									setModuleEnableStartup(false);
									currentBackupObject.moduleEnableStartup = false;
								}
							}

							if (attributes?.ZxBackup_RealTimeScanner) {
								const value = attributes?.ZxBackup_RealTimeScanner?.value;
								if (value) {
									setEnableRealtimeScanner(value);
									currentBackupObject.enableRealtimeScanner = true;
								} else {
									setEnableRealtimeScanner(false);
									currentBackupObject.enableRealtimeScanner = false;
								}
							}

							if (attributes?.ZxBackup_DoSmartScanOnStartup) {
								const value = attributes?.ZxBackup_DoSmartScanOnStartup?.value;
								if (value) {
									setRunSmartScanStartup(value);
									currentBackupObject.runSmartScanStartup = true;
								} else {
									setRunSmartScanStartup(false);
									currentBackupObject.runSmartScanStartup = false;
								}
							}

							if (attributes?.ZxBackup_SpaceThreshold) {
								const value = attributes?.ZxBackup_SpaceThreshold?.value;
								if (value) {
									setSpaceThreshold(value);
									currentBackupObject.spaceThreshold = value;
								} else {
									currentBackupObject.spaceThreshold = 0;
								}
							}

							if (attributes?.backupSmartScanScheduler) {
								const value = attributes?.backupSmartScanScheduler?.value;
								if (value && value['cron-enabled']) {
									setIsScheduleSmartScan(value['cron-enabled']);
									currentBackupObject.isScheduleSmartScan = true;
								} else {
									setIsScheduleSmartScan(false);
									currentBackupObject.isScheduleSmartScan = false;
								}
								if (value && value['cron-pattern']) {
									setScheduleSmartScan(value['cron-pattern']);
									currentBackupObject.scheduleSmartScan = value['cron-pattern'];
								} else {
									currentBackupObject.scheduleSmartScan = '';
								}
							}

							if (attributes?.backupPurgeScheduler) {
								const value = attributes?.backupPurgeScheduler?.value;
								if (value && value['cron-enabled']) {
									setScheduleAutomaticRetentionPolicy(value['cron-enabled']);
									currentBackupObject.scheduleAutomaticRetentionPolicy = true;
								} else {
									setScheduleAutomaticRetentionPolicy(false);
									currentBackupObject.scheduleAutomaticRetentionPolicy = false;
								}
								if (value && value['cron-pattern']) {
									setRetentionPolicySchedule(value['cron-pattern']);
									currentBackupObject.retentionPolicySchedule = value['cron-pattern'];
								} else {
									currentBackupObject.retentionPolicySchedule = '';
								}
							}

							if (attributes?.ZxBackup_DestPath) {
								const value = attributes?.ZxBackup_DestPath?.value;
								if (value) {
									setBackupDestPath(value);
									currentBackupObject.backupDestPath = value;
								} else {
									currentBackupObject.backupDestPath = '';
								}
							}
							if (attributes?.ZxBackup_DataRetentionDays) {
								const value = attributes?.ZxBackup_DataRetentionDays?.value;
								if (value) {
									setKeepDeletedItemInBackup(value);
									currentBackupObject.keepDeletedItemInBackup = value;
								} else {
									currentBackupObject.keepDeletedItemInBackup = 0;
								}
							}

							if (attributes?.backupAccountsRetentionDays) {
								const value = attributes?.backupAccountsRetentionDays?.value;
								if (value) {
									setKeepDeletedAccountsInBackup(value);
									currentBackupObject.keepDeletedAccountsInBackup = value;
								} else {
									currentBackupObject.keepDeletedAccountsInBackup = 0;
								}
							}
						}

						if (data && data?.services?.module?.running) {
							setBackupServiceStart(true);
						} else {
							setBackupServiceStart(false);
						}
						if (data && data?.properties && data?.properties?.backup_initialized) {
							setIsBackupInitialized(true);
						} else {
							setIsBackupInitialized(false);
						}
						setCurrentBackupValue(currentBackupObject);
						setIsDirty(false);
					})
					.catch((error: any) => {
						setIsDirty(false);
						createSnackbar({
							key: 'error',
							type: 'error',
							label: error?.message
								? error?.message
								: t('label.something_wrong_error_msg', 'Something went wrong. Please try again.'),
							autoHideTimeout: 3000,
							hideButton: true,
							replace: true
						});
					});
			}
		}
	}, [server, allServers, createSnackbar, t]);

	const onCancel = useCallback(() => {
		setModuleEnableStartup(currentBackupValue.moduleEnableStartup);
		setEnableRealtimeScanner(currentBackupValue?.enableRealtimeScanner);
		setRunSmartScanStartup(currentBackupValue?.runSmartScanStartup);
		setSpaceThreshold(currentBackupValue?.spaceThreshold);
		setIsScheduleSmartScan(currentBackupValue?.isScheduleSmartScan);
		setScheduleSmartScan(currentBackupValue?.scheduleSmartScan);
		setScheduleAutomaticRetentionPolicy(currentBackupValue?.scheduleAutomaticRetentionPolicy);
		setRetentionPolicySchedule(currentBackupValue?.retentionPolicySchedule);
		setBackupDestPath(currentBackupValue?.backupDestPath);
		setKeepDeletedItemInBackup(currentBackupValue?.keepDeletedItemInBackup);
		setKeepDeletedAccountsInBackup(currentBackupValue?.keepDeletedAccountsInBackup);
		setIsDirty(false);
	}, [
		currentBackupValue?.moduleEnableStartup,
		currentBackupValue?.enableRealtimeScanner,
		currentBackupValue?.runSmartScanStartup,
		currentBackupValue?.spaceThreshold,
		currentBackupValue?.isScheduleSmartScan,
		currentBackupValue?.scheduleSmartScan,
		currentBackupValue?.scheduleAutomaticRetentionPolicy,
		currentBackupValue?.retentionPolicySchedule,
		currentBackupValue?.backupDestPath,
		currentBackupValue?.keepDeletedItemInBackup,
		currentBackupValue?.keepDeletedAccountsInBackup
	]);

	const onSave = useCallback(() => {
		const body: any = {
			ZxBackup_ModuleEnabledAtStartup: {
				value: moduleEnableStartup,
				objectName: server,
				configType: SERVER
			},
			ZxBackup_RealTimeScanner: {
				value: enableRealtimeScanner,
				objectName: server,
				configType: SERVER
			},
			ZxBackup_DoSmartScanOnStartup: {
				value: runSmartScanStartup,
				objectName: server,
				configType: SERVER
			},
			ZxBackup_SpaceThreshold: {
				value: spaceThreshold,
				objectName: server,
				configType: SERVER
			},
			backupSmartScanScheduler: {
				value: {
					'cron-pattern': scheduleSmartScan,
					'cron-enabled': isScheduleSmartScan
				},
				objectName: server,
				configType: SERVER
			},
			backupPurgeScheduler: {
				value: {
					'cron-pattern': retentionPolicySchedule,
					'cron-enabled': scheduleAutomaticRetentionPolicy
				},
				objectName: server,
				configType: SERVER
			},
			ZxBackup_DestPath: {
				value: backupDestPath,
				objectName: server,
				configType: SERVER
			},
			ZxBackup_DataRetentionDays: {
				value: keepDeletedItemInBackup,
				objectName: server,
				configType: SERVER
			},
			backupAccountsRetentionDays: {
				value: keepDeletedAccountsInBackup,
				objectName: server,
				configType: SERVER
			}
		};

		setIsSaveRequestInProgress(true);
		updateBackup(body)
			.then((data: any) => {
				setIsSaveRequestInProgress(false);
				if ((data?.errors && Array.isArray(data?.errors)) || data?.error) {
					let errorMessage = t(
						'label.something_wrong_error_msg',
						'Something went wrong. Please try again.'
					);
					if (data?.errors && Array.isArray(data?.errors) && data?.errors[0]?.error) {
						errorMessage = data?.errors[0]?.error;
					} else if (data?.error) {
						errorMessage = data?.error;
					}
					createSnackbar({
						key: 'error',
						type: 'error',
						label: errorMessage,
						autoHideTimeout: 3000,
						hideButton: true,
						replace: true
					});
				} else {
					setCurrentBackupValue((prev: any) => ({
						...prev,
						moduleEnableStartup,
						enableRealtimeScanner,
						runSmartScanStartup,
						spaceThreshold,
						isScheduleSmartScan,
						scheduleSmartScan,
						scheduleAutomaticRetentionPolicy,
						retentionPolicySchedule,
						backupDestPath,
						keepDeletedItemInBackup,
						keepDeletedAccountsInBackup
					}));
					setIsDirty(false);
					createSnackbar({
						key: 'success',
						type: 'success',
						label: t(
							'label.the_last_changes_has_been_saved_successfully',
							'Changes have been saved successfully'
						),
						autoHideTimeout: 3000,
						hideButton: true,
						replace: true
					});
				}
			})
			.catch((error: any) => {
				setIsSaveRequestInProgress(false);
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
	}, [
		createSnackbar,
		t,
		enableRealtimeScanner,
		moduleEnableStartup,
		runSmartScanStartup,
		server,
		spaceThreshold,
		scheduleSmartScan,
		isScheduleSmartScan,
		retentionPolicySchedule,
		scheduleAutomaticRetentionPolicy,
		backupDestPath,
		keepDeletedItemInBackup,
		keepDeletedAccountsInBackup
	]);

	useEffect(() => {
		if (
			currentBackupValue.moduleEnableStartup !== undefined &&
			currentBackupValue.moduleEnableStartup !== moduleEnableStartup
		) {
			setIsDirty(true);
		}
	}, [currentBackupValue?.moduleEnableStartup, moduleEnableStartup]);

	useEffect(() => {
		if (
			currentBackupValue.enableRealtimeScanner !== undefined &&
			currentBackupValue.enableRealtimeScanner !== enableRealtimeScanner
		) {
			setIsDirty(true);
		}
	}, [currentBackupValue?.enableRealtimeScanner, enableRealtimeScanner]);

	useEffect(() => {
		if (
			currentBackupValue.runSmartScanStartup !== undefined &&
			currentBackupValue.runSmartScanStartup !== runSmartScanStartup
		) {
			setIsDirty(true);
		}
	}, [currentBackupValue?.runSmartScanStartup, runSmartScanStartup]);

	useEffect(() => {
		if (
			currentBackupValue.spaceThreshold !== undefined &&
			currentBackupValue.spaceThreshold !== spaceThreshold
		) {
			setIsDirty(true);
		}
	}, [currentBackupValue?.spaceThreshold, spaceThreshold]);

	useEffect(() => {
		if (
			currentBackupValue.isScheduleSmartScan !== undefined &&
			currentBackupValue.isScheduleSmartScan !== isScheduleSmartScan
		) {
			setIsDirty(true);
		}
	}, [currentBackupValue?.isScheduleSmartScan, isScheduleSmartScan]);

	useEffect(() => {
		if (
			currentBackupValue.scheduleSmartScan !== undefined &&
			currentBackupValue.scheduleSmartScan !== scheduleSmartScan
		) {
			setIsDirty(true);
		}
	}, [currentBackupValue?.scheduleSmartScan, scheduleSmartScan]);

	useEffect(() => {
		if (
			currentBackupValue.scheduleAutomaticRetentionPolicy !== undefined &&
			currentBackupValue.scheduleAutomaticRetentionPolicy !== scheduleAutomaticRetentionPolicy
		) {
			setIsDirty(true);
		}
	}, [currentBackupValue?.scheduleAutomaticRetentionPolicy, scheduleAutomaticRetentionPolicy]);

	useEffect(() => {
		if (
			currentBackupValue.retentionPolicySchedule !== undefined &&
			currentBackupValue.retentionPolicySchedule !== retentionPolicySchedule
		) {
			setIsDirty(true);
		}
	}, [currentBackupValue?.retentionPolicySchedule, retentionPolicySchedule]);

	useEffect(() => {
		if (
			currentBackupValue.backupDestPath !== undefined &&
			currentBackupValue.backupDestPath !== backupDestPath
		) {
			setIsDirty(true);
		}
	}, [currentBackupValue?.backupDestPath, backupDestPath]);

	useEffect(() => {
		if (
			currentBackupValue.keepDeletedItemInBackup !== undefined &&
			currentBackupValue.keepDeletedItemInBackup !== keepDeletedItemInBackup
		) {
			setIsDirty(true);
		}
	}, [currentBackupValue?.keepDeletedItemInBackup, keepDeletedItemInBackup]);

	useEffect(() => {
		if (
			currentBackupValue.keepDeletedAccountsInBackup !== undefined &&
			currentBackupValue.keepDeletedAccountsInBackup !== keepDeletedAccountsInBackup
		) {
			setIsDirty(true);
		}
	}, [currentBackupValue?.keepDeletedAccountsInBackup, keepDeletedAccountsInBackup]);

	const serviceStartStop = useCallback(() => {
		setIsRequestInProgress(true);
		postSoapFetchRequest(
			`/service/admin/soap/zextras`,
			{
				_jsns: 'urn:zimbraAdmin',
				module: 'ZxBackup',
				action: backupServiceStart ? 'doStopService' : 'doStartService',
				service_name: 'module',
				targetServers: server
			},
			'zextras'
		)
			.then((res: any) => {
				setIsRequestInProgress(false);
				if (res?.Body?.response?.content) {
					const content = JSON.parse(res?.Body?.response?.content);
					if (content?.ok && content?.ok === true) {
						setBackupServiceStart(!backupServiceStart);
					}
				}
			})
			.catch((error: any) => {
				setIsRequestInProgress(false);
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
	}, [backupServiceStart, createSnackbar, t, server]);

	const doInitializeBackup = useCallback(
		(isFromInitialize?: boolean) => {
			setIsRequestInProgress(true);
			fetchExternalSoap(`/service/extension/zextras_admin/backup/doSmartScan`, {
				targetServers: [server]
			})
				.then((res: any) => {
					setIsRequestInProgress(false);
					if (isFromInitialize && res && res?.serverId) {
						setIsBackupInitialized(!isBackupInitialized);
					}
				})
				.catch((error: any) => {
					setIsRequestInProgress(false);
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
		},
		[server, createSnackbar, t, isBackupInitialized]
	);

	const doBackupPurge = useCallback(() => {
		setIsPurgeRequestRunning(true);
		fetchExternalSoap(`/service/extension/zextras_admin/backup/doPurge`, {
			targetServers: [server]
		})
			.then((res: any) => {
				setIsPurgeRequestRunning(false);
			})
			.catch((error: any) => {
				setIsPurgeRequestRunning(false);
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
	}, [server, createSnackbar, t]);

	const onBackupExternalVolume = useCallback(() => {
		setIsExternalVolumeRequestRunning(true);
		fetchExternalSoap(`/service/extension/zextras_admin/backup/migrateBackupVolume`, {
			targetServers: [server],
			backup_volume_decommission: true,
			volumeRootPath: backupDestPath,
			useInfrequentAccess: true,
			infrequentAcccessThreshold: 0,
			useIntelligentTiering: true
		})
			.then((res: any) => {
				setIsExternalVolumeRequestRunning(false);
			})
			.catch((error: any) => {
				setIsExternalVolumeRequestRunning(false);
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
	}, [server, createSnackbar, t, backupDestPath]);

	return (
		<Container mainAlignment="flex-start" background="gray6">
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
									{t('backup.server_configuration', 'Server Configuration')}
								</Text>
							</Row>
							<Row
								padding={{ all: 'large' }}
								width="50%"
								mainAlignment="flex-end"
								crossAlignment="flex-end"
							>
								<Padding right="small">
									{isDirty && (
										<Button
											label={t('label.cancel', 'Cancel')}
											color="secondary"
											onClick={onCancel}
											disabled={isRequestInProgress}
										/>
									)}
								</Padding>
								{isDirty && (
									<Button
										label={t('label.save', 'Save')}
										color="primary"
										onClick={onSave}
										disabled={isSaveRequestInProgress}
										loading={isSaveRequestInProgress}
									/>
								)}
							</Row>
						</Row>
					</Container>
					<Divider color="gray2" />
				</Row>
				<Container
					mainAlignment="flex-start"
					crossAlignment="flex-end"
					style={{ overflow: 'auto' }}
					padding={{ all: 'large' }}
					height="calc(100vh - 150px)"
				>
					<Container
						mainAlignment="flex-end"
						crossAlignment="flex-end"
						padding={{ top: 'medium' }}
						height="fit"
						orientation="horizontal"
					>
						<Text>{t('backup.the_service_is', 'The service is')}</Text>&nbsp;
						{!backupServiceStart && <Text color="error">{t('backup.stopped', 'stopped')}</Text>}
						{backupServiceStart && <Text color="primary">{t('backup.running', 'running')}</Text>}
					</Container>

					<Container
						mainAlignment="flex-start"
						crossAlignment="flex-end"
						padding={{ top: 'medium' }}
						height="fit"
					>
						<Button
							type="outlined"
							label={
								backupServiceStart
									? t('backup.stop_service', 'Stop service')
									: t('backup.start_service', 'Start service')
							}
							color={backupServiceStart ? 'error' : 'primary'}
							width="fit"
							height={44}
							onClick={serviceStartStop}
							disabled={isRequestInProgress}
							loading={isRequestInProgress}
						/>
					</Container>

					<Container
						mainAlignment="flex-start"
						crossAlignment="flex-start"
						padding={{ top: 'extralarge' }}
						height="fit"
					>
						<Text size="medium" weight="bold">
							{t('backup.general', 'General')}
						</Text>
					</Container>

					<ListRow>
						<Container
							padding={{ top: 'large' }}
							mainAlignment="flex-start"
							crossAlignment="flex-start"
						>
							<Switch
								label={t(
									'backup.module_is_enabled_at_startup',
									'This module is enabled at startup'
								)}
								value={moduleEnableStartup}
								onClick={(): void => setModuleEnableStartup(!moduleEnableStartup)}
							/>
						</Container>
						<Container padding={{ top: 'large' }}>
							<Switch
								label={t('backup.enable_realtime_scanner', 'Enable RealTime Scanner')}
								value={enableRealtimeScanner}
								onClick={(): void => setEnableRealtimeScanner(!enableRealtimeScanner)}
							/>
						</Container>
						<Container padding={{ top: 'large' }}>
							<Switch
								label={t('backup.run_smartscan_at_startup', 'Run the Smartscan at startup')}
								value={runSmartScanStartup}
								onClick={(): void => setRunSmartScanStartup(!runSmartScanStartup)}
							/>
						</Container>
					</ListRow>

					<ListRow>
						<Container padding={{ top: 'large' }}>
							<Button
								type="outlined"
								label={t('backup.initialize_backup', 'Initialize Backup')}
								color="primary"
								icon="PowerOutline"
								iconPlacement="right"
								height={36}
								width="100%"
								disabled={isBackupInitialized}
								onClick={(): void => {
									doInitializeBackup(true);
								}}
							/>
						</Container>
					</ListRow>

					<ListRow>
						<Container padding={{ top: 'large' }}>
							<Input
								label={t('backup.local_volume', 'Local Volume')}
								value={backupDestPath}
								background="gray5"
								onChange={(e: any): any => {
									setBackupDestPath(e.target.value);
								}}
							/>
						</Container>
					</ListRow>

					<ListRow>
						<Container padding={{ top: 'large' }}>
							<Input
								label={t('backup.space_threshold_mb', 'Space Threshold (MB)')}
								value={spaceThreshold}
								background="gray5"
								onChange={(e: any): any => {
									setSpaceThreshold(e.target.value);
								}}
							/>
						</Container>
					</ListRow>

					<ListRow>
						<Container padding={{ top: 'large' }}>
							<Button
								type="outlined"
								label={t('backup.set_external_volume', 'Set external volume')}
								color="primary"
								icon="HardDriveOutline"
								iconPlacement="right"
								height={36}
								width="100%"
								disabled={!isBackupInitialized || isExternalVolumeRequestRunning}
								onClick={onBackupExternalVolume}
								loading={isExternalVolumeRequestRunning}
							/>
						</Container>
					</ListRow>

					<ListRow>
						<Container
							mainAlignment="flex-start"
							crossAlignment="flex-start"
							orientation="horizontal"
							padding={{ top: 'large' }}
						>
							<Divider />
						</Container>
					</ListRow>

					<Container
						mainAlignment="flex-start"
						crossAlignment="flex-start"
						padding={{ top: 'large' }}
						height="fit"
					>
						<Text size="medium" weight="bold">
							{t('backup.smart_scan_configuration', 'SmartScan Configuration')}
						</Text>
					</Container>

					<Container
						mainAlignment="flex-start"
						crossAlignment="flex-start"
						padding={{ top: 'large' }}
						height="fit"
					>
						<Switch
							label={t('backup.schedule_smartscan', 'Schedule Smartscan')}
							value={isScheduleSmartScan}
							onClick={(): void => setIsScheduleSmartScan(!isScheduleSmartScan)}
						/>
					</Container>

					<ListRow>
						<Container padding={{ top: 'large' }}>
							<Input
								label={t('backup.schedule', 'Schedule')}
								background="gray5"
								value={scheduleSmartScan}
								onChange={(e: any): any => {
									setScheduleSmartScan(e.target.value);
								}}
								disabled={!isScheduleSmartScan}
							/>
						</Container>
					</ListRow>

					<ListRow>
						<Container padding={{ top: 'large' }}>
							<Button
								type="outlined"
								label={t('backup.force_start_smartscan_now', 'Force start smartscan now')}
								color="primary"
								icon="PowerOutline"
								iconPlacement="right"
								height={36}
								width="100%"
								disabled={!isBackupInitialized}
								onClick={(): void => {
									doInitializeBackup();
								}}
							/>
						</Container>
					</ListRow>

					<ListRow>
						<Container
							mainAlignment="flex-start"
							crossAlignment="flex-start"
							orientation="horizontal"
							padding={{ top: 'large' }}
						>
							<Divider />
						</Container>
					</ListRow>

					<Container
						mainAlignment="flex-start"
						crossAlignment="flex-start"
						padding={{ top: 'large' }}
						height="fit"
					>
						<Text size="medium" weight="bold">
							{t('backup.data_retention_policies', 'Data Retention Policies')}
						</Text>
					</Container>

					<ListRow>
						<Container
							padding={{ top: 'large' }}
							mainAlignment="flex-start"
							crossAlignment="flex-start"
						>
							<Switch
								label={t(
									'backup.schedule_automatic_retention_policies',
									'Schedule automatic retention policies'
								)}
								value={scheduleAutomaticRetentionPolicy}
								onClick={(): void =>
									setScheduleAutomaticRetentionPolicy(!scheduleAutomaticRetentionPolicy)
								}
							/>
						</Container>
					</ListRow>

					<ListRow>
						<Container padding={{ top: 'large' }}>
							<Input
								label={t('backup.schedule', 'Schedule')}
								background="gray5"
								value={retentionPolicySchedule}
								onChange={(e: any): any => {
									setRetentionPolicySchedule(e.target.value);
								}}
								disabled={!scheduleAutomaticRetentionPolicy}
							/>
						</Container>
					</ListRow>

					<ListRow>
						<Container
							mainAlignment="flex-start"
							crossAlignment="flex-start"
							orientation="horizontal"
							padding={{ top: 'large', right: 'large' }}
							width="35%"
						>
							<Input
								label={t('backup.keep_deleted_item_in_backup', 'Keep deleted items in the backup')}
								background="gray5"
								value={keepDeletedItemInBackup}
								onChange={(e: any): any => {
									setKeepDeletedItemInBackup(e.target.value);
								}}
								disabled={!scheduleAutomaticRetentionPolicy}
							/>
						</Container>
						<Container
							mainAlignment="flex-start"
							crossAlignment="flex-start"
							orientation="horizontal"
							padding={{ top: 'large', right: 'large' }}
							width="15%"
						>
							<Input
								label={t('backup.range', 'Range')}
								background="gray5"
								value={t('label.days', 'Days')}
							/>
						</Container>
						<Container
							mainAlignment="flex-start"
							crossAlignment="flex-start"
							orientation="horizontal"
							padding={{ top: 'large', right: 'large' }}
							width="35%"
						>
							<Input
								label={t(
									'backup.keep_deleted_account_in_the_backup',
									'Keep deleted account in the backup'
								)}
								background="gray5"
								value={keepDeletedAccountsInBackup}
								onChange={(e: any): any => {
									setKeepDeletedAccountsInBackup(e.target.value);
								}}
								disabled={!scheduleAutomaticRetentionPolicy}
								description="Optional description"
							/>
						</Container>
						<Container
							mainAlignment="flex-start"
							crossAlignment="flex-start"
							orientation="horizontal"
							padding={{ top: 'large' }}
							width="15%"
						>
							<Input
								label={t('backup.range', 'Range')}
								background="gray5"
								value={t('label.days', 'Days')}
							/>
						</Container>
					</ListRow>

					<ListRow>
						<Container
							mainAlignment="flex-start"
							crossAlignment="flex-start"
							orientation="horizontal"
							padding={{ top: 'small', right: 'large' }}
							width="50%"
						>
							<Text overflow="break-word" size="extrasmall">
								<Trans
									i18nKey="backup.back_delete_item_warning_message"
									defaults="If you set 0, <strong>items</strong> will be kept in backup forever ?"
								/>
							</Text>
						</Container>
						<Container
							mainAlignment="flex-start"
							crossAlignment="flex-start"
							orientation="horizontal"
							padding={{ top: 'small', right: 'large' }}
							width="50%"
						>
							<Text overflow="break-word" size="extrasmall">
								<Trans
									i18nKey="backup.back_delete_account_warning_message"
									defaults="If you set 0, <strong>accounts</strong> will be kept in backup forever"
								/>
							</Text>
						</Container>
					</ListRow>
					<ListRow>
						<Container padding={{ top: 'large' }}>
							<Button
								type="outlined"
								label={t('backup.force_backup_purge_now', 'Force backup purge now')}
								color="primary"
								icon="PowerOutline"
								iconPlacement="right"
								height={36}
								width="100%"
								disabled={isPurgeRequestRunning || !isBackupInitialized}
								loading={isPurgeRequestRunning}
								onClick={(): void => {
									doBackupPurge();
								}}
							/>
						</Container>
					</ListRow>
				</Container>
			</Container>
			<RouteLeavingGuard when={isDirty} onSave={onSave}>
				<Text>
					{t(
						'label.unsaved_changes_line1',
						'Are you sure you want to leave this page without saving?'
					)}
				</Text>
				<Text>{t('label.unsaved_changes_line2', 'All your unsaved changes will be lost')}</Text>
			</RouteLeavingGuard>
		</Container>
	);
};
export default BackupConfiguration;
