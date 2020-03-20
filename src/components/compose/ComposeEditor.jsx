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
	justify-content: space-between;
	width: 100%;
	margin-bottom: -${(props) => props.theme.sizes.padding.small};
	padding: ${(props) => `${props.theme.sizes.padding.large} ${props.theme.sizes.padding.large} 0`};
	box-sizing: border-box;
	z-index: 2;
	
	> a {
		width: calc(50% - ${(props) => props.theme.sizes.padding.extrasmall});
		text-decoration: none;
		margin-bottom: ${(props) => props.theme.sizes.padding.small}; 
	}
	&:empty{
		display: none;
	}
`;

function ComposeEditor({
	draftId,
	onEditorChange,
	onRemoveAttachment,
	html,
	body,
	attachments
}) {
	const attachmentsLength = attachments.length;
	return (
		<Container height="fill" mainAlignment="flex-start" background="bg_7">
			<AttRow>
				{
					map(
						attachments,
						(att, index) => (
							<Link
								key={`att-${att.filename}-${index}`}
								to={`/service/home/~/?auth=co&id=${draftId}&part=${att.name}&disp=a`}
								target="_blank"
								download
							>
								<Container
									background="bg_9"
									height="fit"
									crossAlignment="flex-start"
									mainAlignment="space-between"
									orientation="horizontal"
									style={{ cursor: 'pointer' }}
								>
									<Container
										mainAlignment="flex-start"
										crossAlignment="center"
										orientation="horizontal"
										style={{
											flexGrow: 1,
											flexBasis: 0,
											minWidth: '1px'
										}}
									>
										<Padding all="small">
											<GenericFileIcon fileName={att.filename || ''} />
										</Padding>
										<Padding vertical="small" style={{ overflow: 'hidden' }}>
											<Text>{att.filename || att.name}</Text>
											<Text size="small" color="txt_4">{`${Math.ceil(att.size / 1024) || '0'} KB`}</Text>
										</Padding>
									</Container>
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
						)
					)
				}
				{ attachmentsLength > 0 && (
					<Text color="txt_4" style={{ width: '100%' }}>
						{ attachmentsLength } { attachmentsLength === 1 ? 'attachment' : 'attachments' }
					</Text>
				)}
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
