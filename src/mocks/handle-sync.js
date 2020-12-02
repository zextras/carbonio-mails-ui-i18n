/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */
function generateEmptySync(token) {
	return {
		Body: {
			SyncResponse: {
				token,
			},
		},
	};
}

function generateSyncWithOneContact() {
	return {
		Body: {
			SyncResponse: {
				cn: [
					{
						id: '2982',
						l: '7'
					}
				],
				firstSync: false,
				token: '1'
			},
		},
	};
}
const InitialSync = {
	Body: {
		SyncResponse: {
			token: '0',
			folder: [
				{
					id: '11',
					folder: [
						{
							id: '1',
							l: '11',
							absFolderPath: '/',
							name: 'USER_ROOT',
							folder: [
								{
									id: '7',
									l: '1',
									absFolderPath: '/Contacts',
									name: 'Contacts',
									cn: [{
										ids: '1000' /* Comma separated ids */
									}],
									view: 'contact'
								}
							]
						}
					]
				}
			]
		}
	}
};

export function handleSyncRequest(req, res, ctxt) {
	if (!req.body.Body.SyncRequest.token) {
		return res(
			ctxt.json(
				InitialSync
			)
		);
	}
	switch (req.body.Body.SyncRequest.token) {
		case '0':
			return res(
				ctxt.json(
					generateEmptySync('1')
				)
			);
		case '1':
			return res(
				ctxt.json(
					generateSyncWithOneContact()
				)
			);
		default:
			return res(
				ctxt.json(
					generateEmptySync(req.body.Body.SyncRequest.token)
				)
			);
	}
}
