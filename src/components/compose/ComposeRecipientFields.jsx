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

import React, { useState } from 'react';
import {
	ChipInput,
	Container,
	Divider,
	IconButton
} from '@zextras/zapp-ui';

function RecipientRow({ ...props }) {
	const [hasFocus, setHasFocus] = useState(false);

	return (
		<Container orientation="horizontal" mainAlignment="space-between">
			<ChipInput {...props} onFocus={() => setHasFocus(true)} onBlur={() => setHasFocus(false)} style={{ flexGrow: '1', flexBasis: '0', minWidth: '1px' }} />
			<IconButton
				size="large"
				icon="PeopleOutline"
				style={{ visibility: hasFocus ? 'hidden' : 'hidden' }}
			/>
		</Container>
	);
}

function ComposeRecipientFields({
	to,
	cc,
	bcc,
	onParticipantChange
}) {
	const [expandInputs, setExpandInputs] = useState(false);

	return (
		<Container
			orientation="horizontal"
			crossAlignment="flex-start"
			padding={{horizontal: 'large'}}
		>
			<IconButton
				size="large"
				icon={expandInputs ? 'ChevronUp' : 'ChevronDown'}
				onClick={() => setExpandInputs(!expandInputs)}
			/>
			<div style={{ width: '100%', minWidth: '1px' }}>
				<RecipientRow value={to} placeholder="To:" onChange={(value) => onParticipantChange('to', value)} />
				<div style={{ display: expandInputs ? 'block' : 'none' }}>
					<Divider color="bd_5" />
					<RecipientRow value={cc} placeholder="Cc:" onChange={(value) => onParticipantChange('cc', value)} />
					<Divider color="bd_5" />
					<RecipientRow value={bcc} placeholder="Bcc:" onChange={(value) => onParticipantChange('bcc', value)} />
				</div>
			</div>
		</Container>
	);
}

export default ComposeRecipientFields;
