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

const token = '1';

function handleSyncRequest(SyncRequest) {
	const token = SyncRequest.token;
	switch (token) {
		default:
			return {
				_jsns: 'urn:zimbraSoap',
				Body: {
					SyncResponse: {
						_jsns: 'urn:zimbraMail',
						token: '1',
						folder: [
							{"id":"11","uuid":"e93432e8-9fdd-4a64-876a-3e49d0966071","deletable":false,"f":"","color":0,"u":0,"rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":12,"url":"","acl":{},"retentionPolicy":[{}],
								"folder":[
									{"id":"17","uuid":"303e25c7-5ee0-4473-860e-70f710a6d6c8","deletable":false,"name":"Comments","absFolderPath":"/Comments","l":"11","luuid":"e93432e8-9fdd-4a64-876a-3e49d0966071","f":"","color":0,"u":0,"view":"comment","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":18,"url":"","acl":{},"retentionPolicy":[{}]},
									{"id":"9","uuid":"6b5ab0db-f3db-4c52-b4a5-c75f05f68054","deletable":false,"name":"Conversations","absFolderPath":"/Conversations","l":"11","luuid":"e93432e8-9fdd-4a64-876a-3e49d0966071","f":"","color":0,"u":0,"view":"conversation","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":10,"url":"","acl":{},"retentionPolicy":[{}]},
									{"id":"8","uuid":"d143643f-43f7-4263-b8ff-c18b6b127488","deletable":false,"name":"Tags","absFolderPath":"/Tags","l":"11","luuid":"e93432e8-9fdd-4a64-876a-3e49d0966071","f":"","color":0,"u":0,"view":"tag","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":9,"url":"","acl":{},"retentionPolicy":[{}]},
									{"id":"1","uuid":"1434573c-3569-4ccc-89a7-165aecad87a3","deletable":false,"name":"USER_ROOT","absFolderPath":"/","l":"11","luuid":"e93432e8-9fdd-4a64-876a-3e49d0966071","f":"","color":0,"u":0,"rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":2,"url":"","acl":{},"retentionPolicy":[{}],
										"folder":[
											{"id":"16","uuid":"c608b9d4-e1be-4505-b9b0-9c527e53ca33","deletable":false,"name":"Briefcase","absFolderPath":"/Briefcase","l":"1","luuid":"1434573c-3569-4ccc-89a7-165aecad87a3","f":"","color":0,"u":0,"view":"document","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":17,"url":"","acl":{},"retentionPolicy":[{}]},
											{"id":"10","uuid":"abdb4547-adea-4419-aba3-030f8b35c6e3","deletable":false,"name":"Calendar","absFolderPath":"/Calendar","l":"1","luuid":"1434573c-3569-4ccc-89a7-165aecad87a3","f":"#","color":0,"u":0,"view":"appointment","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":11,"url":"","acl":{},"retentionPolicy":[{}]},
											{"id":"14","uuid":"2470c024-5431-4b22-9b9e-017854d46203","deletable":false,"name":"Chats","absFolderPath":"/Chats","l":"1","luuid":"1434573c-3569-4ccc-89a7-165aecad87a3","f":"","color":0,"u":0,"view":"message","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":15,"url":"","acl":{},"retentionPolicy":[{}]},
											{"id":"7","uuid":"c316733e-29e9-4c2e-9748-3fa933f98356","deletable":false,"name":"Contacts","absFolderPath":"/Contacts","l":"1","luuid":"1434573c-3569-4ccc-89a7-165aecad87a3","f":"","color":0,"u":0,"view":"contact","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":8,"url":"","acl":{},"retentionPolicy":[{}]},
											{"id":"6","uuid":"3c6ae5bc-6ab6-459f-88b2-88ccec5f93c4","deletable":false,"name":"Drafts","absFolderPath":"/Drafts","l":"1","luuid":"1434573c-3569-4ccc-89a7-165aecad87a3","f":"","color":0,"u":0,"view":"message","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":30,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":7,"url":"","acl":{},"retentionPolicy":[{}]},
											{"id":"13","uuid":"c99925af-e010-456a-98ab-468671ae2a8b","deletable":false,"name":"Emailed Contacts","absFolderPath":"/Emailed Contacts","l":"1","luuid":"1434573c-3569-4ccc-89a7-165aecad87a3","f":"","color":0,"u":0,"view":"contact","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":14,"url":"","acl":{},"retentionPolicy":[{}]},
											{"id":"2","uuid":"efaf2549-8b71-4161-acce-9ead266e3301","deletable":false,"name":"Inbox","absFolderPath":"/Inbox","l":"1","luuid":"1434573c-3569-4ccc-89a7-165aecad87a3","f":"","color":0,"u":0,"view":"message","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":30,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":3,"url":"","acl":{},"retentionPolicy":[{}]},
											{"id":"4","uuid":"780056a0-a4e0-48dd-add1-20236b18c89e","deletable":false,"name":"Junk","absFolderPath":"/Junk","l":"1","luuid":"1434573c-3569-4ccc-89a7-165aecad87a3","f":"","color":0,"u":0,"view":"message","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":5,"url":"","acl":{},"retentionPolicy":[{}]},
											{"id":"5","uuid":"15336548-43d3-4335-b639-471637226ed6","deletable":false,"name":"Sent","absFolderPath":"/Sent","l":"1","luuid":"1434573c-3569-4ccc-89a7-165aecad87a3","f":"","color":0,"u":0,"view":"message","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":30,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":6,"url":"","acl":{},"retentionPolicy":[{}]},
											{"id":"15","uuid":"e08463b5-7ce0-4583-989c-681fd84af6f0","deletable":false,"name":"Tasks","absFolderPath":"/Tasks","l":"1","luuid":"1434573c-3569-4ccc-89a7-165aecad87a3","f":"#","color":0,"u":0,"view":"task","rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":0,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":16,"url":"","acl":{},"retentionPolicy":[{}]},
											{"id":"3","uuid":"c0ca4a6a-d404-4a17-a2b3-14f34e8af0a6","deletable":false,"name":"Trash","absFolderPath":"/Trash","l":"1","luuid":"1434573c-3569-4ccc-89a7-165aecad87a3","f":"","color":0,"u":0,"rev":1,"ms":1,"md":1598357723,"mdver":1,"meta":[{}],"webOfflineSyncDays":30,"activesyncdisabled":false,"n":0,"s":0,"i4ms":1,"i4next":4,"url":"","acl":{},"retentionPolicy":[{}]}
										]}
								]
						}]
					}
				}
			}
	}
}

const firstSearchResponse = {
	_jsns: 'urn:zimbraSoap',
	Body: {
		SearchResponse: {
			more: false,
			offset: 0,
			sortBy: "dateDesc",
			_jsns: "urn:zimbraMail"
		}
	}
};

module.exports = {
	overrideDefault: false,
	onPost: function(req, res) {
		switch (req.params.SOAP_API) {
			case 'SyncRequest':
				res.json(handleSyncRequest(req.body.Body.SyncRequest));
				return true;
			case 'SearchRequest':
				res.json(firstSearchResponse);
				return true;
			default:
				return false;
		}
	}
};
