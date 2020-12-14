---
title: Architecture
---

### General
Mails App follows the approach of retrieving the data only when the user wants to see them.

The application store as much data as possible using [Redux][1] store in order to minimize the network dependency.

The application receives the changes from the server performing a Sync request and applying the received changes to the
local store.

All the operations that are done by the user are immediately sent to the server and, after a successful
response, applied locally.

### Store

The application saves the retrieved data using the state container provided by [Redux][1].

As suggested in the official documentation, the guideline is to split the state object into
multiple “slices”, which are independent portions of the store, and provide a separate reducer 
function to manage each individual data slice.

Mails' store have the fallowing slices:
- `sync` handle the Sync
- `folders` it's responsible for the list of folders in the secondary bar
- `conversations` it contains all the conversations, grouped by the folder, and provide the data for the
  conversation list, the expanded view and the preview of the conversation (messages collapsed)
- `messages` it contains the map of complete messages, and it's responsible for the expanded view of a message
   (with attachments and body)
- `editor` ...

All the actions that requires the network check if the desired data is already in the store and in that case
it ignores the action.

### Functioning

At the start Mails App does a Sync Request to retrieve the folders (that are displayed in the Secondary Bar).

#### Conversation mode

When the user clicks on a folder the App will download the first 101 conversations (just enough to show the right 
count in the breadcrumb) will be downloaded dispatching the `fetchConversations` (It triggers a `Search` Soap Request).

If the user expands a conversation the App dispatches a `searchConv` (`SearchConv` Soap request) to download the
participants, fragment and subject of the messages).

If the user click on a conversation, the App will navigate to `${mail_address}/${folder_id}/?conversation={conversation_id}`.
In this case the App dispatches the `getConv` (`GetConv` Soap request) that downloads the conversations and the most
recent message in it.

When the used expand a message the app dispatches the action `getMsg` (`GetMsg` Soap request), that downloads the body
and the attachments of the message.

[1]: https://redux.js.org