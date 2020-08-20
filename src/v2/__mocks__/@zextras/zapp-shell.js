/* eslint-disable @typescript-eslint/camelcase */
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


const MockedDb_version_stores = jest.fn();
const MockedDb_version = jest.fn().mockImplementation(() => ({
	stores: MockedDb_version_stores
}));

const MockedDb_table_mapToClass = jest.fn();
const MockedDb_table = jest.fn().mockImplementation(() => ({
	mapToClass: MockedDb_table_mapToClass
}));

class MockedDb {
	version = MockedDb_version;
	table = MockedDb_table;
}

export const db = {
	Database: MockedDb
};

export const _MOCKS_ = {
	MockedDb,
	MockedDb_version,
	MockedDb_version_stores,
	MockedDb_table,
	MockedDb_table_mapToClass
};
