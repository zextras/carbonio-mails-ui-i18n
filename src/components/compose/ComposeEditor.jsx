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
import {
	Container,
	Text,
	RichTextEditor,
	IconButton,
	GenericFileIcon,
	Padding
} from '@zextras/zapp-ui';
import { map } from 'lodash';
import { Link } from 'react-router-dom';

const EditorWrapper = styled.div`
	width: 100%;
	height: 100% !important;

	> .tox:not(.tox-tinymce-inline) {
		width: 100%;
		height: 100% !important;
		border: none;
		
		.tox-editor-header {
			padding: ${(props) => props.theme.sizes.padding.large};
			background-color: ${(props) => props.theme.colors.background.bg_7};
		}
		.tox-edit-area {
			min-height: 150px;
		}
		.tox-toolbar__primary {
			background: none;
			background-color: ${(props) => props.theme.colors.background.bg_9};
			border-radius: ${(props) => props.theme.borderRadius};
		}
	}
	> .tox {
		.tox-edit-area {
			min-height: 150px;
			margin-left: calc(-1rem + ${(props) => props.theme.sizes.padding.large});
		}
	}
`;

const TextArea = styled.textarea`
	box-sizing: border-box;
	padding: ${(props) => props.theme.sizes.padding.large};
	height: 100%;
	min-height: 150px;
	width: 100%;
	border: none;
	resize: none;
	& :focus, :active {
		box-shadow: none;
		border: none;
		outline: none;
	}
`;

const AttRow = styled.div`
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: flex-start;
`;

function ComposeEditor({
	draftId,
	onEditorChange,
	onRemoveAttachment,
	html,
	body,
	attachments
}) {
	return (
		<Container height="fill" mainAlignment="flex-start" background="bg_7" padding={{ all: 'small' }}>
			<AttRow>
				{
					map(
						attachments,
						(att, index) => (
							<Container
								key={`att-${att.filename}-${index}`}
								width="fit"
								height="fit"
								padding={{ all: 'extrasmall' }}
							>
								<Link
									to={`/service/home/~/?auth=co&id=${draftId}&part=${att.name}&disp=a`}
									target="_blank"
									download
									style={{ width: '100%', textDecoration: 'none' }}
								>
									<Container
										background="bg_10"
										height="fit"
										crossAlignment="flex-start"
										mainAlignment="space-between"
										orientation="horizontal"
										style={{ cursor: 'pointer' }}
									>
										<Padding all="small">
											<GenericFileIcon fileName={att.filename || ''} />
										</Padding>
										<Padding vertical="small">
											<Text>{att.filename || att.name}</Text>
											<Text size="small">{`${att.size || '0'}B`}</Text>
										</Padding>
										<IconButton
											icon="Close"
											onClick={(ev) => {
												onRemoveAttachment(att.name);
												ev.stopPropagation();
												ev.preventDefault();
											}}
										/>
									</Container>
								</Link>
							</Container>
						)
					)
				}
			</AttRow>
			{ html
				? (
					<EditorWrapper>
						<RichTextEditor
							initialValue={body.html}
							onEditorChange={([text, htmlContent]) => onEditorChange(text, htmlContent)}
						/>
					</EditorWrapper>
				)
				: (
					<TextArea
						label=""
						value={body.text}
						onChange={(ev) => onEditorChange(ev.target.value, ev.target.value)}
					/>
				)}
		</Container>
	);
}

export default ComposeEditor;
