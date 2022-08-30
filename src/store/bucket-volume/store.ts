/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import create from 'zustand';
import { devtools } from 'zustand/middleware';

type BucketVolumeServerNameState = {
	selectedServerName: string;
	setSelectedServerName: (v: string) => void;
};

export const useBucketVolumeStore = create<BucketVolumeServerNameState>(
	devtools((set) => ({
		selectedServerName: '',

		setSelectedServerName: (selectedServerName): void =>
			set({ selectedServerName }, false, 'setSelectedServerName')
	}))
);
