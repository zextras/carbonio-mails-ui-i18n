---
title: Docs
author: Matteo Dal Zovo
---

Mails is the next brand new mail client for Zextras!

## Workflow
### Basic principles:

Not all folders are synced, by default only the inbox. Folders are synced only when the user opens it explicitly.


### Boot
1. At the boot of the app the mail folders must be loaded

1. If there are folders stored into the storage, sync them

1. Store the folder data for each new folder

1. Start to keep track of the notifications

1. Start to consume the operation queue

### Notifications
Once a notification arrive, it is processed by the app with this behavior:

* If the mail involved is into the storage, update the storage data.

* If the mail involved is not into the storage, add to the storage only if the parent folder is synced into the storage.


### Read an email
Once the MailViewer is displayed, the mail must be loaded. Initially the data is loaded from the local storage, if no data is present into the storage a fetch must be made.

The view must be kept in sync when new data is fetched or changed by a notification. 


### Compose and Send an email
Once the composer is opened, a draft is saved. We will work on the same draft until the send (or delete) event.

Draft is saved on each key hit by the user, debounced by 1s (or a reasonable time) the composer will handle the saving process, displaying the information to the user.

When the mail must be sent, a send draft will be performed against the API.