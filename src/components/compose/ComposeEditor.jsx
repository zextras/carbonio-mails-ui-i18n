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

const Editor = styled(RichTextEditor)`
& > .tox {
	height: 100%;
	width: 100%;
	border: none;
}
`;

const TextArea = styled.textarea`
	box-sizing: border-box;
	margin: 0 8px;
	padding: 8px;
	height: fit-content;
	min-height: 100px;
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
									<IconButton icon="Close" onClick={() => onRemoveAttachment(att.name)} />
								</Container>
							</Container>
						)
					)
				}
			</AttRow>
			{ html
				? (
					<Editor
						initialValue={body.html}
						onEditorChange={([text, htmlContent]) => onEditorChange(text, htmlContent)}
					/>
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
