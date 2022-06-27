/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const removeDistributionListMember = async (id: JSON, dlm: JSON): Promise<any> => {
	const request: any = {
		RemoveDistributionListMemberRequest: {
			_jsns: 'urn:zimbraAdmin',
			id
		}
	};

	if (dlm) {
		request.RemoveDistributionListMemberRequest.dlm = dlm;
	}

	return fetch(`/service/admin/soap/RemoveDistributionListMemberRequest`, {
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
