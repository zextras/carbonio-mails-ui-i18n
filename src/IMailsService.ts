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

export interface IMailsService {
	createFolder(name: string, parent: string): void;
	moveFolder(id: string, newParent: string): void;
	renameFolder(id: string, name: string): void;
	deleteFolder(id: string): void;
	emptyFolder(id: string): void;
	loadMoreConversationsFromFolder(folderId: string): Promise<void>;
}

export type MailFolderOp = CreateMailFolderOp
	| MoveMailFolderOp
	| RenameMailFolderOp
	| DeleteMailFolderOp
	| EmptyMailFolderOp;

export type CreateMailFolderOp = {
	operation: 'create-mail-folder';
	parent: string;
	name: string;
	id: string;
};

export type MoveMailFolderOp = {
	operation: 'move-mail-folder';
	parent: string;
	id: string;
};

export type RenameMailFolderOp = {
	operation: 'rename-mail-folder';
	name: string;
	id: string;
};

export type DeleteMailFolderOp = {
	operation: 'delete-mail-folder';
	id: string;
};

export type EmptyMailFolderOp = {
	operation: 'empty-mail-folder';
	id: string;
};
