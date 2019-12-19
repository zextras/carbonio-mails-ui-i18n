---
title: Fiber Channel API
author: Matteo Dal Zovo
---

📫 | Int | Event Name | Data | Notes
:-:|:---:|:----------:|------|-------
📥📤 | ✔ | `mail:folder:updated` | `id`:string | Inform the mailSyncService that a folder has been updated
📥📤 | ✔ | `mail:folder:deleted` | `id`:string | Inform the mailSyncService that a folder has been deleted
📥📤 | ✔ | `mail:item:updated` | `id`:string | Inform the mailSyncService that an item has been updated
📥📤 | ✔ | `mail:item:deleted` | `id`:string | Inform the mailSyncService that an item has been deleted
📥 || `notification:item:deleted` || See Shell FC Docs.
📥 || `app:all-loaded` || See Shell FC Docs.
