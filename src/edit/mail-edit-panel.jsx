import React, { useCallback, useState } from 'react';
import { hooks } from '@zextras/zapp-shell';
import {
	Container,
	Divider,
	Icon,
	IconButton,
	Padding,
	Row,
	Text
} from '@zextras/zapp-ui';
import { useTranslation } from 'react-i18next';
import EditView from './edit-view';

export default function MailEditPanel({ editPanelId, folderId }) {
	const [header, setHeader] = useState(undefined);
	return (
		<>
			<MailEditHeader editPanelId={editPanelId} folderId={folderId} header={header} />
			<Container mainAlignment="flex-start" height="fit" style={{ maxHeight: 'calc(100% - 49px)', flexGrow: '1' }} background="gray6">
				<EditView panel={true} editPanelId={editPanelId} folderId={folderId} setHeader={setHeader} />
			</Container>
		</>
	);
};

const MailEditHeader = ({ editPanelId, folderId, header }) => {
	const { t } = useTranslation();
	const replaceHistory = hooks.useReplaceHistoryCallback();

	const onClose = useCallback(
		() => replaceHistory(`/folder/${folderId}`),
		[folderId, replaceHistory]
	);

	return (
		<Container
			height={49}
		>
			<Container
				orientation="horizontal"
				mainAlignment="flex-start"
				height={48}
				padding={{ left: 'large', right: 'extrasmall' }}
			>
				<Icon size="medium" icon="EditOutline" />
				<Row
					takeAvailableSpace
					mainAlignment="flex-start"
					padding={{ left: 'large' }}
				>
					<Text size="large">
						{ header || t('Edit Draft') }
					</Text>
				</Row>
				<IconButton icon="Close" onClick={onClose} />
			</Container>
			<Divider />
		</Container>
	);
};
