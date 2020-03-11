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
import { Container, Button, IconCheckbox, FileLoader } from '@zextras/zapp-ui';

const StyledButton = styled(Button)`
	svg {
		transform: rotate(90deg);
	}
`;
function ComposeActions({
	onFileLoad,
	onModeChange,
	onPriorityChange,
	onSend,
	priority
}) {
	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-end"
			crossAlignment="center"
			padding={{ vertical: 'small', horizontal: 'large' }}
		>
			<Container orientation="horizontal" width="auto">
				<IconCheckbox onChange={onModeChange} icon="Text" />
				<IconCheckbox onChange={onPriorityChange} defaultChecked={priority} icon="ArrowUpward" />
				<IconCheckbox icon="CheckmarkSquareOutline" />
				<IconCheckbox icon="Edit2Outline" />
				<FileLoader onChange={onFileLoad} />
			</Container>
			<Container padding={{ left: 'extralarge' }} orientation="horizontal" width="auto">
				<StyledButton label="Send" icon="Navigation" onClick={onSend} />
			</Container>
		</Container>
	);
}

export default ComposeActions;
