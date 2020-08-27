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
// const takeScreenshot = require('./utils').takeScreenshot;
// const performLoginAndRouteTo = require('./utils').performLoginAndRouteTo;

const until = protractor.ExpectedConditions;

describe('App', function() {
	beforeEach(async function () {
		await browser.get('http://localhost:9000');
		await browser.waitForReact(100000, '#app');
	});

	it('Main menu item is rendered', async function() {
		await browser.get('http://localhost:9000');
		await browser.waitForReact(100000, '#app');
		await browser.executeAsyncScript("e2e.loadMockedApi('e2e/mocked-api/first-sync-with-empty-folders.js')");
		await browser.executeScript("e2e.setupCompleted()");
		await browser.wait(until.presenceOf(element(by.linkText('Mails')), 5000, 'Element taking too long to appear in the DOM'));
		expect(element(by.linkText('Mails')).isPresent()).toBeTruthy();
	});
});
