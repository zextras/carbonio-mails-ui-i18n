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

import styled from 'styled-components';
import { Avatar, Container, Icon, Padding } from '@zextras/zapp-ui';
import React from 'react';

export const HoverAvatar = styled.div`
	background: ${({theme, selected}) => theme.colors.background[selected ? 'bg_1' : 'bg_7']};
	box-sizing: border-box;
	border: ${({theme, selecting}) => selecting ? `2px solid ${theme.colors.border.bd_2}` : 'none'};
	width: ${({theme}) => theme.sizes.avatar.medium.diameter};
	min-width: ${({theme}) => theme.sizes.avatar.medium.diameter};
	height: ${({theme}) => theme.sizes.avatar.medium.diameter};
	min-height: ${({theme}) => theme.sizes.avatar.medium.diameter};
	border-radius: 50%;
	display: flex;
	justify-content: center;
	align-items: center;
	${({theme, selected, selecting, selectable}) => selectable ?
	`&:hover {
		background: ${selected
		? theme.colors.hover.hv_1
		: (selecting
				? theme.colors.hover.hv_7
				: theme.colors.background.bg_5
		)
		};
		> ${AvatarContainer} {
			display: none;
		}
	}` : ''}
`;

export const AvatarContainer = styled.div`
	${({selecting}) => selecting && 'display: none;'}
`;

export const HoverContainer = styled(Container)`
	background: ${({theme, selected}) => theme.colors.background[selected ? 'bg_11' : 'bg_7']};
	& :hover {
		background: ${({theme}) => theme.colors.hover.hv_7}
	}
`;

export const SelectableAvatar = ({
	selecting,
	selected,
	selectable,
	onSelect,
	onDeselect,
	label,
	colorLabel
}) => (
	<Padding all="small">
		<HoverAvatar
			selected={selected}
			selecting={selecting}
			selectable={selectable}
			onClick={(ev) => {
				ev.stopPropagation();
				selected
					? onDeselect && onDeselect()
					: onSelect && onSelect();
			}}
		>
			{ !selecting
			&& (
				<AvatarContainer selecting={selecting}>
					<Avatar
						label={label}
						colorLabel={colorLabel}
						size="medium"
					/>
				</AvatarContainer>
			)}
			{ (selected || !selecting)
			&& <Icon size="large" icon="Checkmark" color={selected ? 'txt_3' : 'txt_1'}/> }
		</HoverAvatar>
	</Padding>
);

SelectableAvatar.defaultProps = {
	selectable: true
};
