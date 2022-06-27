/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const distributionListAction = async (dl: JSON, action?: JSON): Promise<any> => {
	const request: any = {
		DistributionListActionRequest: {
			_jsns: 'urn:zimbraAccount',
			dl
		}
	};
	if (action) {
		request.DistributionListActionRequest.action = action;
	}

	return fetch(`/service/admin/soap/DistributionListActionRequest`, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			Body: request
		})
	});
};
