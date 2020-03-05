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
import React, { useEffect, useRef } from 'react';
import { forEach, reduce } from 'lodash';
import { getBodyToRender } from '../ISoap';

const _CI_REGEX = /^<(.*@zimbra)>$/;
const _CI_SRC_REGEX = /^cid:(.*@zimbra)$/;

const _TextMessageRenderer = ({ body }) => {
	const containerRef = useRef();

	useEffect(() => {
		containerRef.current.innerText = body.content;
	}, [containerRef.current, body]);

	return (
		<div style={{ fontFamily: 'monospace' }} ref={containerRef} />
	);
};

const _HtmlMessageRenderer = ({ msgId, body, parts }) => {
	const iframeRef = useRef();

	useEffect(() => {
		iframeRef.current.contentDocument.open();
		iframeRef.current.contentDocument.write(body.content);
		iframeRef.current.contentDocument.close();

		const imgMap = reduce(
			parts,
			(r, v, k) => {
				if (!_CI_REGEX.test(v.ci)) return r;
				r[_CI_REGEX.exec(v.ci)[1]] = v;
				return r;
			},
			{}
		);

		const images = iframeRef.current.contentDocument.body.getElementsByTagName('img');

		forEach(
			images,
			(p, k) => {
				if (!_CI_SRC_REGEX.test(p.src)) return;
				const ci = _CI_SRC_REGEX.exec(p.getAttribute('src'))[1];
				if (imgMap.hasOwnProperty(ci)) {
					const part = imgMap[ci];
					p.setAttribute('pnsrc', p.getAttribute('src'));
					p.setAttribute('src', `/service/home/~/?auth=co&id=${msgId}&part=${part.name}`);
				}
			}
		);
	}, [iframeRef.current, body, parts, msgId]);

	return (
		<iframe
			title={msgId}
			ref={iframeRef}
			onLoad={(ev) => {
				ev.persist();
				ev.currentTarget.style.height = ev.currentTarget.contentWindow.document.body.scrollHeight + 'px';
			}}
			style={{
				border: 'none',
				width: '100%'
			}}
		/>
	);
};

const MailMessageRenderer = ({ mailMsg, onUnreadLoaded }) => {
	const [body, parts] = getBodyToRender(mailMsg);
	useEffect(() => {
		if (!mailMsg.read) {
			onUnreadLoaded();
		}
	},
	[]);
	if (body.contentType === 'text/html') {
		return (<_HtmlMessageRenderer msgId={mailMsg.id} body={body} parts={parts} />);
	}
	else if (body.contentType === 'text/plain') {
		return (<_TextMessageRenderer body={body} />);
	}
	else {
		throw new Error(`Cannot render '${body.contentType}'`);
	}
};
export default MailMessageRenderer;
