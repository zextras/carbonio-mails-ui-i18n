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
import { Container } from '@zextras/zapp-ui';

const Notch = styled.div`
	width: 6px;
	height: 16px;
	border-radius: 3px;
	background: ${({ theme }) => theme.palette.gray2.regular};
`;

export const VerticalDivider = () => (
	<Container
		width={8}
		background="gray5"
	>
		{/*<Notch />*/}
	</Container>
);
