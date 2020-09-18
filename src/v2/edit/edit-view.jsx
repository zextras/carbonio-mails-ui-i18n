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
	useCallback, useEffect,
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
	Catcher, IconCheckbox, Tooltip
} from '@zextras/zapp-ui';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import useCompositionData from './use-composition-data';

const ResizedIconCheckbox = styled(IconCheckbox)`
	[class^="Padding__Comp"] {
		padding: 6px;
		svg {
			height: 20px;
			width: 20px;
		}
	}
`;

const TextArea = styled.textarea`
	box-sizing: border-box;
	padding: ${(props) => props.theme.sizes.padding.large};
	height: fit-content;
	min-height: 150px;
	flex-grow: 1;
	width: 100%;
	border: none;
	resize: none;
	& :focus, :active {
		box-shadow: none;
		border: none;
		outline: none;
	}
`;

const EditorWrapper = styled.div`
	width: 100%;
	height: 100%;
	overflow-y: auto;
	position: relative;

	> .tox:not(.tox-tinymce-inline) {
		width: 100%;
		border: none;
		
		.tox-editor-header {
			padding: ${(props) => props.theme.sizes.padding.large};
			background-color: ${(props) => props.theme.palette.gray6.regular};
		}
		.tox-toolbar__primary {
			background: none;
			background-color: ${(props) => props.theme.palette.gray4.regular};
			border-radius: ${(props) => props.theme.borderRadius};
		}
	}
	> .tox {
		.tox-edit-area {
			margin-left: calc(-1rem + ${(props) => props.theme.sizes.padding.large});
			overflow-y: auto;
			max-height: 100%;
		}
		.tox-edit-area__iframe {
			height: 100%;
			padding-bottom: ${(props) => props.theme.sizes.padding.large};
		}
		&.tox-tinymce {
			height: 100% !important;
		}
	}
`;


export default function EditView({
	panel, editPanelId, folderId, setHeader
}) {
	const [html, setHtml] = useState('');

	const {
		compositionData,
		actions
	} = useCompositionData(editPanelId, panel || false, folderId);

	const { t } = useTranslation();

	const [open, setOpen] = useState(false);

	const toggleOpen = useCallback(
		() => setOpen((isOpen) => !isOpen),
		[]
	);

	useEffect(() => {
		if (setHeader) setHeader(compositionData.subject);
	}, [compositionData.subject, setHeader]);

	useEffect(() => {
		setHtml(compositionData.body.html);
	}, [compositionData.body.html]);

	const onEditorChange = useCallback((change) => {
		setHtml(change[1]);
		actions.updateBody(change);
	}, [actions]);

	return (
		<Catcher>
			<Container mainAlignment="flex-start" height="100%" style={{ maxHeight: '100%' }}>
				<Container
					crossAlignment="unset"
					height="fit"
				>
					<Row
						padding={{ all: 'medium' }}
						orientation="horizontal"
						mainAlignment="flex-end"
						width="100%"
					>
						<Tooltip label={t('toggleRichText')}>
							<ResizedIconCheckbox
								icon="Text"
								value={!compositionData.richText}
								onChange={actions.toggleRichText}
							/>
						</Tooltip>
						<Tooltip label={t('toggleUrgent')}>
							<ResizedIconCheckbox
								icon="ArrowUpward"
								value={compositionData.urgent}
								onChange={actions.toggleUrgent}
							/>
						</Tooltip>
						<Tooltip label={t('toggleFlagged')}>
							<ResizedIconCheckbox
								icon="FlagOutline"
								value={compositionData.flagged}
								onChange={actions.toggleFlagged}
							/>
						</Tooltip>
						<Padding left="large">
							<Button
								onClick={actions.sendMail}
								label={t('send')}
							/>
						</Padding>
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
								onChange={(value) => actions.updateContacts('to', value)}
								value={compositionData.to}
							/>
							<Divider />
							<Collapse orientation="vertical" crossSize="100%" open={open}>
								<ChipInput
									placeholderType="inline"
									placeholder={t('cc')}
									onChange={(value) => actions.updateContacts('cc', value)}
									value={compositionData.cc}
								/>
								<Divider />
								<ChipInput
									placeholderType="inline"
									placeholder={t('bcc')}
									onChange={(value) => actions.updateContacts('bcc', value)}
									value={compositionData.bcc}
								/>
								<Divider />
							</Collapse>
						</Container>
					</Container>
					<Padding value="0 0 0 48px" style={{ width: 'auto' }}>
						<EmailComposerInput
							onChange={(ev) => actions.updateSubject(ev.target.value)}
							placeholder={t('subject')}
							placeholderType="default"
							value={compositionData.subject}
						/>
					</Padding>
					<Divider />
				</Container>
				{ compositionData.richText
					? (
						<EditorWrapper>
							<RichTextEditor
								value={html}
								onEditorChange={onEditorChange}
								minHeight={150}
							/>
						</EditorWrapper>
					)
					: (
						(
							<TextArea
								label=""
								value={compositionData.body.text}
								onChange={(ev) => {
									// eslint-disable-next-line no-param-reassign
									ev.target.style.height = 'auto';
									// eslint-disable-next-line no-param-reassign
									ev.target.style.height = `${25 + ev.target.scrollHeight}px`;
									actions.updateBody([ev.target.value, ev.target.value]);
								}}
							/>
						)
					)}
				<Divider />
			</Container>
		</Catcher>
	);
}
