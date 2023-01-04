/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';
import { Modal, Row, Button, Text, Container } from '@zextras/carbonio-design-system';
import { Trans, useTranslation } from 'react-i18next';

const DeleteOpearationsModel: FC<{
	open: boolean;
	closeHandler: any;
	saveHandler: any;
	operationMessage: any;
	modelHandler: boolean;
}> = ({ open, closeHandler, saveHandler, operationMessage, modelHandler }) => {
	const [t] = useTranslation();
	return (
		<>
			<Modal
				size="medium"
				title={t('operations.label.operation_model_message', '{{OperationMsg}}', {
					OperationMsg: operationMessage
				})}
				open={open}
				customFooter={
					<Container orientation="horizontal" mainAlignment="flex-end">
						<Row style={{ gap: '8px' }} padding={{ right: 'small' }}>
							<Button
								type="outlined"
								label={t('operations.label.let_it_run_btn', 'LET IT RUN')}
								color="primary"
								onClick={closeHandler}
							/>
							<Button
								label={
									modelHandler
										? t('operations.label.cancel_operation_btn', 'CANCEL OPERATION')
										: t('operations.label.stop_operation_btn', 'STOP OPERATION')
								}
								color="error"
								onClick={(): void => {
									saveHandler(modelHandler);
								}}
							/>
						</Row>
					</Container>
				}
				showCloseIcon
				onClose={closeHandler}
			>
				<Text
					size={'extralarge'}
					overflow="break-word"
					style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '32px 0' }}
				>
					{modelHandler ? (
						<Trans
							i18nKey="label.cancel_operations_msg"
							defaults="Are you sure you want to CANCEL this operation? <br /> By clicking CANCEL OPERATION, it will be removed from the operations queue list."
							components={{ break: <br /> }}
						/>
					) : (
						<Trans
							i18nKey="label.stop_operations_msg"
							defaults="Are you sure you want to STOP this operation? <br /> By clicking STOP OPERATION, it will be stopped and removed from the operations queue list."
							components={{ break: <br /> }}
						/>
					)}
				</Text>
			</Modal>
		</>
	);
};

export default DeleteOpearationsModel;
