---
title: API
---

| 📫 | Event Name | Data | Notes |
|---|------------|------|-------|
|| `mails:updated:folder` | `id`: string ||
|| `mails:deleted:folder` | `id`: string ||
|| `mails:updated:message` | `id`: string ||
|| `mails:updated:conversation` | `id`: string ||

## Operations
## SOAP
SOAP calls involved on mail synchronisation will let the application to send and retrieve changes on mailbox.
Calls involved in synchronisation are:

- `Sync` without a previous token set on request’s parameters will be used to retrieve and save mail folder lists that have to be synchronised.
- `Sync` with the previous `Sync`'s token set as request’s parameter will be used in order to check changes on mailbox. Different changes will be treated in different ways:
    - deleted mails will be deleted
    - created and edited mail ids will be used to call `Search` to retrieve all the information
- `Search` will be used to retrieve all the information of a given mail in order to keep local data synchronised

Alongside the synchronization, other calls used are  
- `CreateFolder` will be used to create a mail folder.
- `FolderAction` will be used to perform actions like `move` or `delete` on the folders.

### Sync
For the `Sync` management please refer to the Shell project.
The `Sync` is not performed directly by the Mails App.

### Search
#### Fetch conversations of a folder
The fetch will retrieve the conversations inside a folder.

### CreateFolder
Request performed to create a mail folder.
```typescript
type Request = {
  folder: {
  		view: 'message',
  		l: '$PARENT_ID',
  		name: '$NAME'
  	}
};
```
### FolderAction
Requests performed to move, rename or move a mail folder.
#### Move
Request performed to move a mail folder.
```typescript
type Request = {
  action: {
    op: 'move',
    id: '$FOLDER_ID',
    l: '$PARENT_ID'
  }
};
```
#### Rename
Request performed to rename a mail folder.
```typescript
type Request = {
  action: {
    op: 'rename',
    id: '$FOLDER_ID',
    name: '$NAME'
  }
};
```
#### Delete
Request performed to delete a mail folder.
```typescript
type Request = {
  action: {
    op: 'delete',
    id: '$FOLDER_ID'
  }
};
```
#### Empty
Request performed to delete a mail folder.
```typescript
type Request = {
  action: {
    op: 'empty',
    id: '$FOLDER_ID',
    recursive: true
  }
};
```
