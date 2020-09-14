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
	toArray: jest.fn().mockImplementation(() => Promise.resolve([])),
	reverse: jest.fn().mockImplementation(() => MockedCollection),
	sortBy: jest.fn().mockImplementation(() => Promise.resolve([])),
}));

const MockedWhereClause = jest.fn().mockImplementation(() => ({
	anyOf: MockedCollection,
	equals: MockedCollection
}));

const MockedAddClause = jest.fn().mockImplementation(() => ({
	anyOf: MockedCollection,
	equals: MockedCollection
}));

class MockedTable {
	where = MockedWhereClause;

	add = MockedAddClause;

	bulkGet = jest.fn().mockImplementation(() => Promise.resolve([]));
	bulkAdd = jest.fn().mockImplementation(() => Promise.resolve([]));
	get = jest.fn().mockImplementation(() => Promise.resolve());
}

export class MailsDbDexie {
	conversations = new MockedTable();
	messages= new MockedTable();
	folders = new MockedTable();
	deletions = new MockedTable();

	messages = new MockedTable();

	observe = jest.fn(() => {
		throw new Error('Mock "observe" not implemented.');
	});
	createUUID = jest.fn();
	transaction = jest.fn();
}
