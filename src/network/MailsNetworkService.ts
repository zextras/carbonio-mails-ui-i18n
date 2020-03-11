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

import { reduce, map } from 'lodash';
import { IFolderSchmV1 } from '@zextras/zapp-shell/lib/sync/IFolderSchm';
import { IMailsNetworkService } from './IMailsNetworkService';
import { IMailsIdbService } from '../idb/IMailsIdbService';
import {
	normalizeConversationFromSoap,
	normalizeMailMessageFromSoap,
	SoapConvObj, SoapEmailMessageObj
} from '../ISoap';
import {
	Conversation,
	ConversationMailMessage,
	MailMessage
} from '../idb/IMailsIdb';
import { normalizeFolder } from '../idb/IdbMailsUtils';

export default class MailsNetworkService implements IMailsNetworkService {
	constructor(
		private _idbSrvc: IMailsIdbService
	) {}

	public fetchFolderByPath(path: string): Promise<IFolderSchmV1> {
		const getFolderReq = {
			Body: {
				GetFolderRequest: {
					_jsns: 'urn:zimbraMail',
					folder: [{
						path
					}]
				}
			}
		};
		return fetch(
			'/service/soap/GetFolderRequest',
			{
				method: 'POST',
				body: JSON.stringify(getFolderReq)
			}
		)
			.then((response) => response.json())
			.then((response) => {
				if (response.Body.Fault) throw new Error(response.Body.Fault.Reason.Text);
				return normalizeFolder(response.Body.GetFolderResponse.folder[0]);
			});
	}

	public fetchFolderById(id: string): Promise<IFolderSchmV1> {
		const getFolderReq = {
			Body: {
				GetFolderRequest: {
					_jsns: 'urn:zimbraMail',
					folder: [{
						l: id
					}]
				}
			}
		};
		return fetch(
			'/service/soap/GetFolderRequest',
			{
				method: 'POST',
				body: JSON.stringify(getFolderReq)
			}
		)
			.then((response) => response.json())
			.then((response) => {
				if (response.Body.Fault) throw new Error(response.Body.Fault.Reason.Text);
				return normalizeFolder(response.Body.GetFolderResponse.folder[0]);
			});
	}

	public fetchConversationsInFolder(id: string, limit = 50): Promise<Conversation[]> {
		return Promise.all([
			this._idbSrvc.getFolderById(id),
			this._idbSrvc.fetchConversationsFromFolder(id)
		])
			.then(([f, convs]) => {
				if (!f) return [];
				const before = reduce(
					convs,
					(r, v, k) => ((v.date < r || r === 0) ? v.date : r),
					0
				);
				const queryPart = [
					`in:"${f!.path}"`
				];
				if (before > -1) queryPart.push(`before:${before}`);
				const searchReq = {
					Body: {
						SearchRequest: {
							_jsns: 'urn:zimbraMail',
							sortBy: 'dateDesc',
							types: 'conversation',
							fullConversation: 1,
							needExp: 1,
							recip: 0,
							limit,
							query: queryPart.join(' '),
							fetch: 'all'
						}
					}
				};
				return fetch(
					'/service/soap/SearchRequest',
					{
						method: 'POST',
						body: JSON.stringify(searchReq)
					}
				)
					.then((response) => response.json())
					.then((response) => {
						if (response.Body.Fault) throw new Error(response.Body.Fault.Reason.Text);
						return reduce<SoapConvObj, Conversation[]>(
							response.Body.SearchResponse.c || [],
							(r, v, k) => r.concat(normalizeConversationFromSoap(v)),
							[]
						);
					});
			});
	}

	public fetchConversationsMessages(convs: Conversation[]): Promise<MailMessage[]> {
		if (convs.length < 1) return Promise.resolve([]);

		const mailIds: string[] = reduce(
			convs,
			(r: string[], v: Conversation, k) => r.concat(
				reduce(
					v.messages,
					(r1: string[], v1: ConversationMailMessage, k1) => r1.concat(v1.id),
					[]
				)
			),
			[]
		);

		return this.fetchMailMessages(mailIds);
	}

	public fetchMailMessages(mailIds: string[]): Promise<MailMessage[]> {
		if (mailIds.length < 1) return Promise.resolve([]);
		const request = {
			Body: {
				SearchRequest: {
					_jsns: 'urn:zimbraMail',
					types: 'message',
					sortBy: 'dateDesc',
					recip: '2',
					html: 1,
					limit: mailIds.length,
					query: `is:anywhere item:"${mailIds.join(',')}"`,
					fetch: 'all'
				}
			}
		};
		return fetch(
			'/service/soap/SearchRequest',
			{
				method: 'POST',
				body: JSON.stringify(request)
			}
		)
			.then((resp) => resp.json())
			.then((resp) => {
				if (resp.Body.Fault) throw new Error(resp.Body.Fault.Reason.Text);
				return reduce(
					resp.Body.SearchResponse.m,
					(r: MailMessage[], v: SoapEmailMessageObj, k) => r.concat(normalizeMailMessageFromSoap(v)),
					[]
				);
			});
	}

	public fetchConversations(convIds: string[]): Promise<Conversation[]> {
		const request = {
			Body: {
				GetConvRequest: {
					_jsns: 'urn:zimbraMail',
					c: map(
						convIds,
						(id) => ({ id, fetch: 'all', html: '1' })
					)
				}
			}
		};
		return fetch(
			'/service/soap/GetConvRequest',
			{
				method: 'POST',
				body: JSON.stringify(request)
			}
		)
			.then((resp) => resp.json())
			.then((response) => {
				if (response.Body.Fault) throw new Error(response.Body.Fault.Reason.Text);
				return reduce<SoapConvObj, Conversation[]>(
					response.Body.GetConvResponse.c || [],
					(r, v, k) => r.concat(normalizeConversationFromSoap(v)),
					[]
				);
			});
	}

	public uploadAttachment(file: File): Promise<void> {
		return fetch(
			'/service/upload?fmt=extended,raw',
			{
				method: 'POST',
				body: JSON.stringify(file)
			}
		).then(console.debug).catch(console.warn).finally(console.log);
	}
}
