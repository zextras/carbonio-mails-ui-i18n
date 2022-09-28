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
	isVolumeAllDetail: Array<any>;
	setIsVolumeAllDetail: (isVolumeAllDetail: Array<any>) => void;
};

export const useBucketVolumeStore = create<BucketVolumeServerNameState>(
	devtools((set) => ({
		selectedServerName: '',
		isVolumeAllDetail: [],
		setSelectedServerName: (selectedServerName): void =>
			set({ selectedServerName }, false, 'setSelectedServerName'),
		setIsVolumeAllDetail: (isVolumeAllDetail): void =>
			set({ isVolumeAllDetail }, false, 'setIsVolumeAllDetail')
	}))
);
