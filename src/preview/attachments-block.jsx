/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { map, reduce } from 'lodash';

import {
	Container,
	Icon,
	Link,
	Padding,
	Text,
	Row
} from '@zextras/zapp-ui';

const AttachmentsActions = styled(Row)``;

function findAttachments(parts, acc) {
	return reduce(
		parts,
		(found, part) => {
			if (part.disposition === 'attachment') {
				found.push(part);
			}
			return findAttachments(part.parts, found);
		},
		acc
	);
}

function getSizeLabel(size) {
	let value = '';
	if (size < 1024000) {
		value = `${Math.round((size / 1024) * 100) / 100} KB`;
	}
	else if (size < 1024000000) {
		value = `${Math.round((size / 1024 / 1024) * 100) / 100} MB`;
	}
	else {
		value = `${Math.round((size / 1024 / 1024 / 1024) * 100) / 100} GB`;
	}
	return value;
}

function getAttachmentsLink(messageId, messageSubject, attachments) {
	if (attachments.length > 1) {
		return `/service/home/~/?auth=co&id=${messageId}&filename=${messageSubject}&charset=UTF-8&part=${attachments.join(',')}&disp=a&fmt=zip`;
	}
	return `/service/home/~/?auth=co&id=${messageId}&part=${attachments.join(',')}&disp=a`;
}

const AttachmentLink = styled.a`
	text-decoration: none;
	width: calc(50% - 4px);
	margin-bottom: ${({ theme }) => theme.sizes.padding.small};
`;
const AttachmentExtension = styled(Text)`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 24px;
	height: 24px;
	border-radius: ${({ theme }) => theme.borderRadius};
	background-color: ${({ theme }) => theme.palette.primary.regular};
	color: ${({ theme }) => theme.palette.gray6.regular};
	font-size: calc(${({ theme }) => theme.sizes.font.small} - 2px);
	text-transform: uppercase;
	margin-right: ${({ theme }) => theme.sizes.padding.small};
`;
const AttachmentContainer = styled(Row)`
	transition: 0.2s ease-out;
	&:hover {
		background-color: ${({ theme, background }) => theme.palette[background].hover};
	}
	&:focus {
		background-color: ${({ theme, background }) => theme.palette[background].focus};
	}
`;

function Attachment({ filename, size, link }) {
	const extension = filename.split('.').pop();
	const sizeLabel = useMemo(() => getSizeLabel(size), [size]);
	return (
		<AttachmentLink
			rel="noopener noreferrer"
			target="_blank"
			href={link}
			download
		>
			<AttachmentContainer padding={{ all: 'small' }} background="gray5">
				<AttachmentExtension>{ extension }</AttachmentExtension>
				<Row orientation="vertical" crossAlignment="flex-start" takeAvailableSpace>
					<Padding style={{ width: '100%' }} bottom="extrasmall"><Text>{ filename }</Text></Padding>
					<Text color="gray1" size="small">{ sizeLabel }</Text>
				</Row>
			</AttachmentContainer>
		</AttachmentLink>
	);
}

export default function AttachmentsBlock({ message }) {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);
	const attachments = useMemo(() => findAttachments(message.parts, []), [message]);

	const attachmentsCount = useMemo(() => attachments.length, [attachments]);
	const attachmentsParts = useMemo(() => map(attachments, 'name'), [attachments]);
	const actionsDownloadLink = useMemo(() =>
		getAttachmentsLink(message.id, message.subject, attachmentsParts), [message, attachmentsParts]);
	const attachmentLabel = useMemo(() => (attachmentsCount === 1 ? t('attachment') : t('attachments')), [attachmentsCount, t]);

	return attachmentsCount > 0 && (
		<Container crossAlignment="flex-start">
			<Container orientation="horizontal" mainAlignment="space-between" wrap="wrap">
				{ map(
					expanded ? attachments : attachments.slice(0, 2),
					(att, index) => (
						<Attachment
							key={`att-${att.filename}-${index}`}
							filename={att.filename}
							size={att.size}
							link={getAttachmentsLink(message.id, message.subject, [att.name])}
						/>
					)
				) }
			</Container>
			<AttachmentsActions
				mainAlignment="flex-start"
				padding={{ top: 'extrasmall', bottom: 'medium' }}
			>
				<Padding right="small">
					{
						attachmentsCount < 3
						&& (
							<Text color="gray1">
								{ attachmentsCount }
								{' '}
								{ attachmentLabel }
							</Text>
						)
					}
					{ attachmentsCount > 2 && (expanded
						? (
							<Row onClick={() => setExpanded(false)} style={{ cursor: 'pointer' }}>
								<Padding right="small">
									<Text color="primary">
										{ attachmentsCount }
										{' '}
										{ attachmentLabel }
									</Text>
								</Padding>
								<Icon icon="ArrowIosUpward" color="primary" />
							</Row>
						) : (
							<Row onClick={() => setExpanded(true)} style={{ cursor: 'pointer' }}>
								<Padding right="small">
									<Text color="primary">
										{ t('Show all') }
										{' '}
										{ attachmentsCount }
										{' '}
										{ attachmentLabel }
									</Text>
								</Padding>
								<Icon icon="ArrowIosDownward" color="primary" />
							</Row>
						)
					)}
				</Padding>
				<Link size="medium" href={actionsDownloadLink}>
					{ attachmentsCount > 1 ? t('Download all') : t('Download') }
				</Link>
			</AttachmentsActions>
		</Container>
	);
}
