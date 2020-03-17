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
import { Container, Text, RichTextEditor, Input, DownloadFileButton } from '@zextras/zapp-ui';
import { map } from 'lodash';
const Editor = styled(RichTextEditor)`
& > * {
	height: 100%;
	width: 100%;
	border: none;
}
`;

function ComposeEditor({
	onEditorChange,
	html,
	body,
	attachments
}) {
	return (
		<>
			{
				map(
					attachments,
					(att, index) => (
						<Container
							key={`att-${att.filename}-${index}`}
							padding={{ vertical: 'extrasmall' }}
							width="fill"
						>
							<DownloadFileButton
								fileName={att.filename}
							/>
						</Container>
					)
				)
			}
			{ html
				? (
					<Editor
						initialValue={body.html}
						onEditorChange={([text, htmlContent]) => onEditorChange(text, htmlContent)}
					/>
				)
				: (
					<Input
						label=""
						value={body.text}
						onChange={(ev) => onEditorChange(ev.target.value, ev.target.value)}
					/>
				)}
		</>
	);
}

export default ComposeEditor;
