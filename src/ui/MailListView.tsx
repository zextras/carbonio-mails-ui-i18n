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

import React, { FC } from 'react';
import { useRouteMatch, Redirect } from 'react-router-dom';

interface IMailListViewProps {}

const MailListView: FC<IMailListViewProps> = () => {
	const match = useRouteMatch<{ path: string }>('/mail/folder/:path');
	if (match && match.params && match.params.path) {
		return (
			<div>
				Hello mail
			</div>
		);
	}
	return (
		<Redirect
			to="/"
		/>
	);
};
export default MailListView;
