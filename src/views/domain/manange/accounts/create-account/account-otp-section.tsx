/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo, useContext, useState, useEffect } from 'react';
import { Container, Padding, Row, Button, Text, Icon } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import QRCode from 'qrcode.react';
import { useDomainStore } from '../../../../../store/domain/store';
import { AccountContext } from './account-context';

const CustomIcon = styled(Icon)`
	width: 20px;
	height: 20px;
`;

const AccountOtpSection: FC = () => {
	const conext = useContext(AccountContext);
	const { accountDetail } = conext;
	const domainName = useDomainStore((state) => state.domain?.name);
	const cosList = useDomainStore((state) => state.cosList);
	const [cosItems, setCosItems] = useState<any[]>([]);
	const [showOtpOptionSection, setShowOtpOptionSection] = useState<boolean>(true);
	const [qrData, setQrData] = useState();
	const [t] = useTranslation();
	useEffect(() => {
		if (!!cosList && cosList.length > 0) {
			const arrayItem: any[] = [];
			cosList.forEach((item: any) => {
				arrayItem.push({
					label: item.name,
					value: item.id
				});
			});
			setCosItems(arrayItem);
		}
	}, [cosList]);
	// const handleOnGenerateOTP = () =>
	// 	fetchSoap('GenerateOTPRequest', {
	// 		_jsns: 'urn:zextrasClient',
	// 		humanReadable: false,
	// 		labelPrefix: otpLabel
	// 	}).then((res) => {
	// 		if (res.response.ok) {
	// 			const uri = res.response.value.URI;
	// 			setQrData(uri);
	// 			setPinCodes(res.response.value.static_otp_codes);
	// 			setModalStep(stepsNames.generate_otp);
	// 			userMail.current = uri
	// 				? decodeURIComponent(uri.substring(uri.indexOf('-') + 1, uri.indexOf('?')))
	// 				: '';
	// 		} else {
	// 			setErrorLabel(t('error.alreadyInUse'));
	// 		}
	// 	});
	return (
		<Container
			mainAlignment="flex-start"
			padding={{ left: 'large', right: 'extralarge', bottom: 'large' }}
		>
			{showOtpOptionSection ? (
				<>
					<Container
						orientation="horizontal"
						width="99%"
						crossAlignment="center"
						mainAlignment="space-between"
						background="#E6F2D8"
						padding={{
							top: 'large',
							bottom: 'large'
						}}
						style={{ borderRadius: '2px 2px 0px 0px' }}
					>
						<Row
							takeAvwidth="fill"
							mainAlignment="center"
							width="100%"
							padding={{
								top: 'small',
								bottom: 'small'
							}}
						>
							<Padding horizontal="small">
								<CustomIcon icon="InfoOutline" color="success"></CustomIcon>
							</Padding>
							<Text overflow="break-word">
								{t(
									'domain.the_account_has_been_successfully_created',
									'The account has been successfully created'
								)}
							</Text>
						</Row>
					</Container>

					<Row
						takeAvwidth="fill"
						mainAlignment="center"
						width="100%"
						padding={{
							top: 'large',
							bottom: 'large'
						}}
					>
						<Button
							label={t('domain.i_want_to_generate_an_otp_code', 'I WANT TO GENERATE AN OTP CODE')}
							onClick={(): void => setShowOtpOptionSection(false)}
							width="fill"
						/>
					</Row>
					<Row
						takeAvwidth="fill"
						mainAlignment="center"
						width="100%"
						padding={{
							top: 'large',
							bottom: 'large'
						}}
					>
						<Button
							label={t(
								'domain.proceed_without_generating_an_otp_code',
								'PROCEED WITHOUT GENERATING AN OTP CODE'
							)}
							onClick={(): void => setShowOtpOptionSection(false)}
							width="fill"
							type="outlined"
						/>
					</Row>
				</>
			) : (
				<>
					<QRCode data-testid="qrcode-password" size={143} bgColor="transparent" value={'qrData'} />
				</>
			)}
			{!showOtpOptionSection ? <></> : <></>}
		</Container>
	);
};

export default AccountOtpSection;
