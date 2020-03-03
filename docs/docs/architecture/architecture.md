---
title: Architecture
---

The Mails App needs to keep mail data synchronized on the client.

Mail data will be saved into the storage given to the app by the shell.
The data will be retained to improve the responsiveness during operations like the search and offline operations.

Each time a mail will be deleted, received, created, edited on the client, the changes will be synchronised on Zimbra’s mail list and spread all over the clients.
This update is handled by the operation stack handled by the Shell.

Synchronisation will be implemented by using Zimbra SOAP API.
