---
title: Data
author: Zextras Iris Team
---

## Mail

Field | Type | 🔑 | Notes
---|---|---|---
`attachment` 			| `boolean` | |  |
`bodyPath`				| `string` | | Defines the path inside the parts of the mail |
`conversationId`	| `string` | 🗂 |  |
`contacts`				| `Array<MailContact>` | | A map of the contacts |
`date`						| `number` | |  |
`flagged`					| `boolean` | |  |
`folder`					| `string` | 🗂 | The folder id |
`fragment`				| `string` | | Preview of the message |
`id`							| `string` | 🔑 |  |
`parts`						| `Array<MailPart>` | |  |
`read`						| `boolean` | |  |
`size`						| `number` | |  |
`subject`					| `string` | |  |
`urgent`					| `boolean` | |  |

### MailPart

Field | Type | Notes
---|---|---
`contentType` | `string` | |
`size` | `number` | |
`content` | `string?` | |
`name` | `string` | Name of the part, usually represents a number |
`filename` | `string?` | |
`parts` | `Array<MailPart>?` | |

### MailContact

Field | Type | Notes
---|---|---
`name` | `string?` | |
`address` | `string` | |
`type` | `MailContactType` | |

Note: Contacts are not shared with the Contact App, the contact here is the plain contact of the Mail app.

For display purpose the contact details can be retrieved from the Contact App and displayed here, but this is optional as the Contact App may not be installed/enabled.

#### MailContactType

Name | Value
---|---
`from` | `from`
`to` | `to`
`cc` | `cc`
`bcc` | `bcc`
`replyTo` | `reply-to`
`sender` | `sender`
`readReceiptNotification` | `read-receipt-notification`
`resentFrom` | `resent-from`

## Conversation

Field | Type | 🔑 | Notes
---|---|---|---
`attachment`			| `boolean` | |  |
`contacts`				| `Array<MailContact>` | | A map of the contacts |
`date`						| `number` | |  |
`flagged`					| `boolean` | |  |
`folder`					| `string` | 🗂 | The folder id |
`fragment`				| `string` | | Preview of the message |
`id`							| `string` | 🔑 |  |
`messages`				| `Array<string>` | |  |
`msgCount`				| `number` | |  |
`parts`						| `Array<MailPart>` | |  |
`read`						| `boolean` | |  |
`size`						| `number` | |  |
`subject`					| `string` | |  |
`unreadMsgCount`	| `number` | |  |
`urgent`					| `boolean` | |  |
