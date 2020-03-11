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
import { Container, Text } from '@zextras/zapp-ui';

const StyledDiv = styled.div`
	width: 100%;
	height: 100%;
	min-height: 200px;
	padding: 24px;
	background-color: #fff;
	overflow-y: auto;
	box-sizing: border-box;
	font-family: ${(props) => props.theme.fonts.default};
`;

function ComposeEditor({}) {
	return (
		<StyledDiv>Editor</StyledDiv>
	);
}

export default ComposeEditor;
