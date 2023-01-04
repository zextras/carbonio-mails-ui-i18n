/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
const MiliSecondToDate: any = (time: any) => {
	const date = new Date(time).toLocaleDateString();
	let hours = new Date(time).getHours();
	const AmOrPm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12 || 12;
	const minutes = new Date(time).getMinutes();
	const finalTime = `${hours}:${minutes} ${AmOrPm}`;

	return `${date} - ${finalTime}`;
};

export default MiliSecondToDate;
