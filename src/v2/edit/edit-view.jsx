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

import React, {
	useCallback,
	useState
} from 'react';
import {
	Button,
	Container,
	Row,
	IconButton,
	EmailComposerInput,
	Collapse,
	Divider,
	ChipInput,
	Padding,
	RichTextEditor,
	Catcher
} from '@zextras/zapp-ui';
import { useTranslation } from 'react-i18next';
import useCompositionData from './use-composition-data';

export default function EditView({ panel, editPanelId, folderId }) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const toggleOpen = useCallback(
		() => setOpen((isOpen) => !isOpen),
		[]
	);
	const { compositionData, updateField, updateBody } = useCompositionData(editPanelId);
	return (
		<Catcher>
			<Container mainAlignment="flex-start">
				<Row
					padding={{ all: 'medium' }}
					orientation="horizontal"
					mainAlignment="flex-end"
					width="100%"
				>
					<Button
						onClick={console.log}
						label={t('send')}
					/>
				</Row>
				<Container orientation="horizontal" width="fill" height="fit" crossAlignment="flex-start">
					<Padding top="extrasmall">
						<IconButton
							size="large"
							icon={open ? 'ChevronUp' : 'ChevronDown'}
							onClick={toggleOpen}
						/>
					</Padding>
					<Container>
						<ChipInput
							placeholder={t('to')}
							onChange={(value) => updateField('to', value)}
							value={compositionData.to}
						/>
						<Divider />
						<Collapse orientation="vertical" crossSize="100%" open={open}>
							<ChipInput
								placeholderType="inline"
								placeholder={t('cc')}
								onChange={(value) => updateField('cc', value)}
								value={compositionData.cc}
							/>
							<Divider />
							<ChipInput
								placeholderType="inline"
								placeholder={t('bcc')}
								onChange={(value) => updateField('bcc', value)}
								value={compositionData.bcc}
							/>
							<Divider />
						</Collapse>
					</Container>
				</Container>
				<EmailComposerInput
					onChange={(ev) => updateField('subject', ev.target.value)}
					placeholder={t('subject')}
					placeholderType="inline"
					value={compositionData.subject}
				/>
				<Divider />
				<RichTextEditor
					initialValue={compositionData.body}
					onEditorChange={updateBody}
				/>
				<Divider />
			</Container>
		</Catcher>
	);
}
