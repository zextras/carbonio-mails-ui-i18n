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

const MockedCollection = jest.fn().mockImplementation(() => ({
	toArray: jest.fn().mockImplementation(() => Promise.resolve([]))
}));

const MockedWhereClause = jest.fn().mockImplementation(() => ({
	anyOf: MockedCollection
}));

const MockedTable = jest.fn().mockImplementation(() => ({
	where: MockedWhereClause,
	bulkGet: jest.fn().mockImplementation(() => Promise.resolve([]))
}));

export class MailsDbDexie {
	folders = new MockedTable();
	deletions = new MockedTable();
}
