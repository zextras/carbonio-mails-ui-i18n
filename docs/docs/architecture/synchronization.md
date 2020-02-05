---
title: Synchronization
---

The synchronisation will be divided in three different phases: initial synchronisation, retrieve changes from server, push changes on server.

## Workflow

### Init

1. Initialize the [IndexedDB][1].
1. Load the stored data into the data structures.
1. (**On first load only**) Synchronize all the Mail folders of the user.
1. Listen for changes which involves any Mail.

### First Synchronization
First synchronization is made through the `SyncService` provided by the shell.
Any mail folder of the user (and not the shared ones) will be synced only if the user explicitly navigated into it.
For each folder element returned by the sync operated by the `SyncService` will trigger a `SearchRequest` 
if the folder is required to be synced.

### Synchronization
The synchronization is handled by the Shell and the mail app is notified about the updates on mail.
The process can be syntetized with these steps:
1. The `SyncRequest` is processed by the shell and inform for the changes using the `FiberChannel`.
    1. A `SearchRequest` is performed to retrieve all changed mail data.
1. Search for conflicts on incoming data and the stored one, merge strategy is defined with:
    1. Most recent edit will be kept. 
    1. If is not determinable the date of the edit, the server data is kept.
1. Save server data into the local storage.
1. Send edits and new drafts with `SaveDraftRequest` request.

### Local edits
Each edit or creation will be handled sending a `create` or `modify` operation through the `FiberChannel`.

[1]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
