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

import React, { FC, useState } from 'react';
import { sendSOAPRequest } from '@zextras/zapp-shell/network';
import { map } from 'lodash';

import ComposerContext from './ComposerContext';
import { IComposerInputs } from './IComposerContext';
import { ISaveDraftRequest, ISaveDraftResponse, IMailContact } from './IComposerSoap';

const ComposerContextProvider: FC<{}> = ({ children }) => {
	const [contextValues, setContextValues] = useState<IComposerInputs>(
		{
			to: '',
			cc: '',
			subject: '',
			message: ''
		}
	);
	const [id, setId] = useState<string>();

	const setField = (field: 'to' | 'cc' | 'subject' | 'message', text: string): void => {
		const newValues: IComposerInputs = { ...contextValues };
		switch (field) {
			case 'to':
				newValues.to = text;
				break;
			case 'cc':
				newValues.cc = text;
				break;
			case 'subject':
				newValues.subject = text;
				break;
			case 'message':
				newValues.message = text;
				break;
			default:
				break;
		}
		setContextValues(newValues);
	};

	const save = (): void => {
		const resp = sendSOAPRequest<ISaveDraftRequest, ISaveDraftResponse>('SaveDraft', {
			m: {
				id,
				su: contextValues.subject,
				e: [
					{
						t: 'f',
						a: 'admin@example.com'
					},
					{
						t: 't',
						a: contextValues.to
					},
					...(map(
						contextValues.cc.split(' '),
						(str: string): IMailContact => ({
							a: str,
							t: 'c'
						})
					))
				],
				mp: [
					{
						ct: 'text/plain',
						content: {
							_content: contextValues.message,
						}
					}
				]
			},
		}, 'urn:zimbraMail').then((r: ISaveDraftResponse): void => setId(r.m.id));
	};

	const send = (): void => {
		const resp = sendSOAPRequest<ISaveDraftRequest, ISaveDraftResponse>('SendMsg', {
			m: {
				id,
				su: contextValues.subject,
				e: [
					{
						t: 'f',
						a: 'admin@example.com'
					},
					{
						t: 't',
						a: contextValues.to
					},
					...map(
						{ ...contextValues.cc.split(' ') },
						(str: string): IMailContact => ({
							a: str,
							t: 'c'
						})
					)
				],
				mp: [
					{
						ct: 'text/plain',
						content: {
							_content: contextValues.message,
						}
					}
				]
			},
		}, 'urn:zimbraMail').then();
	};

	return (
		<ComposerContext.Provider
			value={{
				...contextValues,
				setField,
				save,
				send
			}}
		>
			{ children }
		</ComposerContext.Provider>
	);
};
export default ComposerContextProvider;
