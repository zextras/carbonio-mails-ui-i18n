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

import React from 'react';
import styled from 'styled-components';
import { Container, ChipInput, Icon } from '@zextras/zapp-ui';
import ComposeActions from './ComposeActions';
import ComposeRecipientFields from './ComposeRecipientFields';

function ComposeSubject({...rest}) {
	return (
		<Container {...rest} orientation="horizontal">
			<ChipInput placeholder="Object:" style={{ flexGrow: '1', flexBasis: '0', minWidth: '1px' }} />
			<Icon size="large" icon="ArrowUpward" color="txt_5" />
		</Container>
	);
}
const ComposeSubjectStyled = styled(ComposeSubject)`
	padding: ${(props) => `${props.theme.sizes.padding.extrasmall} ${props.theme.sizes.padding.medium} ${props.theme.sizes.padding.extrasmall} calc(${props.theme.sizes.padding.large} + ${props.theme.sizes.padding.medium} * 2 + ${props.theme.sizes.icon.large})`};
	border: 1px solid ${(props) => props.theme.colors.border.bd_5};
	border-width: 1px 0;
`;
const ContainerEl = styled(Container)`
	border-top: 1px solid ${(props) => props.theme.colors.border.bd_1};
`;
function ComposeInputs({
	onFileLoad,
	onModeChange,
	onPriorityChange,
	onParticipantChange,
	onSend,
	to,
	cc,
	bcc,
	subject,
	priority
}) {
	return (
		<ContainerEl
			height="fit"
			background="bg_7"
		>
			<ComposeActions
				onFileLoad={onFileLoad}
				onModeChange={onModeChange}
				onPriorityChange={onPriorityChange}
				onSend={onSend}
				priority={priority}
			/>
			<ComposeRecipientFields onParticipantChange={onParticipantChange} to={to} cc={cc} bcc={bcc} />
			<ComposeSubjectStyled value={[{ value: `${subject}a` }]} />
		</ContainerEl>
	);
}

export default ComposeInputs;
