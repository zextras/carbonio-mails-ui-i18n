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
import {
	Container,
	IconButton,
	Padding
} from '@zextras/zapp-ui';

function PreviewPanelActions({ conversation }) {
	return <Container height="auto" padding={{ top: 'large' }} />;
	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-end"
			crossAlignment="center"
			height="auto"
			padding={{ horizontal: 'large', vertical: 'small' }}
		>
			<Padding left="extrasmall"><IconButton size="medium" icon="UndoOutline" /></Padding>
			{ /* <Padding left="extrasmall"><IconButton size="medium" icon="ArchiveOutline" /></Padding> */ }
			<Padding left="extrasmall"><IconButton size="medium" icon="Trash2Outline" /></Padding>
			{ /* <Padding left="extrasmall"><IconButton size="medium" icon="PricetagsOutline" /></Padding> */ }
			{ /* <Padding left="extrasmall"><IconButton size="medium" icon="MoreVertical" /></Padding> */ }
		</Container>
	);
}

export default PreviewPanelActions;
