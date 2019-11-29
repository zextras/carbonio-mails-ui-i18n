/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2019 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import React, { FC, useEffect, useState } from 'react';
import { IMailService } from './IMailService';
import MailServiceContext from './MailServiceContext';
import { IMailFolder } from '../sync/IMailSyncService';

interface IMailServiceContextProvider {
	mailSrvc: IMailService;
	path: string;
}

const MailServiceContextProvider: FC<IMailServiceContextProvider> = ({ children, path, mailSrvc }) => {
	const [ currentPath, setCurrentPath ] = useState<string>(path);
	const [ [ currentFolder, breadcrumbs], setBreadCrumbs ] = useState<[IMailFolder|undefined, Array<IMailFolder>]>([undefined, []]);

	const onSetCurrentPath = (path: string) => {
		setCurrentPath(`/${path}`);
		setBreadCrumbs(
			mailSrvc.getFolderBreadcrumbs(`/${path}`)
		)
	};

	useEffect(
		() => {
			onSetCurrentPath(path);
		},
		[path]
	);

	return (
		<MailServiceContext.Provider
			key={`folder-${path}`}
			value={{
				setCurrentFolder: (path) => onSetCurrentPath(path),
				currentPath,
				currentFolder: currentFolder,
				currentBreadCrumbs: breadcrumbs
			}}
		>
			{ children }
		</MailServiceContext.Provider>
	);
};
export default MailServiceContextProvider;
