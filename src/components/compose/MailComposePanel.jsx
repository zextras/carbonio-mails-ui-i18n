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
import { Container, Divider, useScreenMode } from '@zextras/zapp-ui';
import useCompositionData from './useCompositionData';
import ComposeHeader from './ComposeHeader';
import ComposeInputs from './ComposeInputs';
import ComposeEditor from './ComposeEditor';

const MailComposePanel = ({ id, mailsSrvc }) => {
	const screenMode = useScreenMode();
	const data = useCompositionData(id, mailsSrvc);
	return (
		<Container
			background="bg_9"
			mainAlignment="flex-start"
		>
			<ComposeHeader />
			<Container
				background="bg_9"
				mainAlignment="flex-start"
				padding={screenMode === 'desktop' ? { horizontal: 'small', bottom: 'small'} : {}}
				style={{ overflowY: 'auto' }}
			>
				<ComposeInputs
					onFileLoad={data.onFileLoad}
					onSend={data.onSend}
					onParticipantChange={data.onParticipantChange}
					onModeChange={data.onModeChange}
					onPriorityChange={data.onPriorityChange}
					onSubjectChange={data.onSubjectChange}
					to={data.to}
					cc={data.cc}
					bcc={data.bcc}
					subject={data.subject}
					priority={data.priority}
					html={data.html}
				/>
				<ComposeEditor
					attachments={data.attachments}
					onEditorChange={data.onEditorChange}
					onRemoveAttachment={data.onRemoveAttachment}
					html={data.html}
					body={data.body}
				/>
			</Container>
		</Container>
	);
}

export default MailComposePanel;
