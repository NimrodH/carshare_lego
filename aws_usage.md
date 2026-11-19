# AWS usage: API Gateway → Lambda → DynamoDB

This document shows how the carshare client (`index.html`, `world.js`, `message.js`) reaches AWS. All resources are in **us-east-1**.

Sources: the code on `main` and the live AWS configuration (API Gateway routes, Lambda environment variables, DynamoDB table list), read on 2026-11-19.

## Overview

```
Browser (index.html / world.js / message.js)
 │
 ├── HTTP API  "CSTP-addUser"  https://t8l4i3853e.execute-api.us-east-1.amazonaws.com/V1/
 │     POST  /addAvatar            → CSTP-addAvatar        → cs_avatars, cs_signs
 │     PATCH /avatars/{avatarID}   → CSTP-patch            → cs_signs, cs_avatars
 │     GET   /getAllStatuses       → CSTP_getAllStatuses   → cs_signs, cs_avatars
 │     POST  /checkAndUpdate       → CSTP_checkAndUpdate   → cs_avatars
 │     POST  /chat/start           → cs_startChat          → cs_avatars, cs_chats
 │     POST  /chat/sendLine        → cs_startChat          → cs_chats
 │     GET   /chat/getText         → cs_startChat          → cs_chats, cs_avatars
 │     POST  /chat/end             → cs_startChat          → cs_chats, cs_avatars
 │
 └── WebSocket API  "cs_carShare"  wss://j5i50qrird.execute-api.us-east-1.amazonaws.com/production/
       $connect                    → cs_connect
       $disconnect                 → cs_disconnect         → cs_avatars, PendingRetries
       createAvatar                → cs_create_avatar      → cs_avatars, PendingRetries
       startChat, cs_startChat     → cs_startChat
       $default, moveAvatars       → (no integration)

EventBridge rule "RetryEveryMinute" → RetrySender → PendingRetries (resends unconfirmed WebSocket messages)
```

## 1. API Gateway

| API | Type | Stage | Used by the client in |
|---|---|---|---|
| `CSTP-addUser` (`t8l4i3853e`) | HTTP API | `V1` (also `$default`) | `index.html` helpers `getData`, `postData`, `patchData`, `markDone`; called from `world.js`, `message.js` |
| `cs_carShare` (`j5i50qrird`) | WebSocket, route by `$request.body.action` | `production` | `index.html` (`socketUrl`, `WebSocketClient`) |

### HTTP routes (`CSTP-addUser`)

| Method and path | Lambda | Called from (client) |
|---|---|---|
| `POST /addAvatar` | `CSTP-addAvatar` | `world.js` (`postData("addAvatar", signData)`) |
| `PATCH /avatars/{avatarID}` | `CSTP-patch` | `world.js` (`patchData(...)` for `isLoading`, `status`), `index.html` `markDone()` |
| `GET /getAllStatuses` | `CSTP_getAllStatuses` | `world.js`, `message.js` (polling) |
| `POST /checkAndUpdate` | `CSTP_checkAndUpdate` | `world.js` (before a chat starts) |
| `POST /chat/start` | `cs_startChat` | `world.js` |
| `POST /chat/sendLine` | `cs_startChat` | `world.js`, `message.js` |
| `GET /chat/getText` | `cs_startChat` | `message.js` |
| `POST /chat/end` | `cs_startChat` | `world.js` |

`cs_startChat` routes on its own by `rawPath` (`/V1/chat/start`, `/V1/chat/sendLine`, `/V1/chat/getText`, `/V1/chat/end`), so it must be called through the `V1` stage.

### WebSocket routes (`cs_carShare`)

| Route key | Lambda | Notes |
|---|---|---|
| `$connect` | `cs_connect` | Code not in this repo |
| `$disconnect` | `cs_disconnect` | A copy is in `server/updated but not in use/cs_disconnect.py`; the deployed version may differ |
| `createAvatar` | `cs_create_avatar` | The client sends `{action:"createAvatar", type:...}`. Handles `type` = `createAvatar`, `setStatus`, `keepalive`, `serverMsgDone` (an acknowledgement sent from `confirm2server()` in `index.html`) |
| `startChat`, `cs_startChat` | `cs_startChat` | Same Lambda as the HTTP chat routes |
| `$default`, `moveAvatars` | none | Routes exist without an integration |

## 2. Lambdas

| Lambda | Runtime | Source in repo | Environment variables (live) | Tables |
|---|---|---|---|---|
| `CSTP-addAvatar` | python3.13 | `server/CSTP-addAvatar.py` | `CORS_ORIGIN` (table names use code defaults) | writes `cs_avatars`, `cs_signs` |
| `CSTP-patch` | python3.13 | `server/CSTP-patch.py` | `CORS_ORIGIN` | updates `cs_signs` and `cs_avatars` |
| `CSTP_getAllStatuses` | python3.13 | `server/CSTP_getAllStatuses.py` | `CORS_ORIGIN` | scans `cs_signs`, `cs_avatars`; updates `cs_avatars` (`lastPeriodicUpdateAt`, stale avatars set to `done`) |
| `CSTP_checkAndUpdate` | python3.13 | `server/CSTP_checkAndUpdate.py` | `CORS_ORIGIN` | reads and does conditional updates on `cs_avatars` (other table names are rejected) |
| `cs_startChat` | python3.13 | `server/cs_startChat.py` | `AVATARS_TABLE_NAME=cs_avatars`, `CHATS_TABLE_NAME=cs_chats`, `API_GATEWAY_ENDPOINT` (WebSocket) | transactions across `cs_avatars` and `cs_chats`; best-effort WebSocket nudge |
| `cs_create_avatar` | python3.12 | `server/cs_create_avatar.py` | `AVATARS_TABLE_NAME=cs_avatars`, `SIGNS_TABLE_NAME=cs_signs`, `CHATS_TABLE_NAME=cs_chats`, `URLS_TABLE_NAME=cs_avatarsURLplace`, `API_GATEWAY_ENDPOINT` | puts, updates and scans `cs_avatars`; writes and deletes `PendingRetries`; enables the `RetryEveryMinute` rule |
| `cs_disconnect` | python3.13 | `server/updated but not in use/cs_disconnect.py` (may be stale) | `API_GATEWAY_ENDPOINT` | `cs_avatars` (sets `status=done`), `PendingRetries` |
| `RetrySender` | python3.13 | `server/updated but not in use/RetrySender.py` (may be stale) | `API_GATEWAY_ENDPOINT` | reads, updates and deletes `PendingRetries` |
| `cs_connect` | python3.12 | not in repo | none | unknown |

**Environment variable mismatch.** `cs_startChat.py` reads `AVATARS_TABLE` / `CHATS_TABLE`, but the Lambda sets `AVATARS_TABLE_NAME` / `CHATS_TABLE_NAME`. It works only because the code defaults are `cs_avatars` / `cs_chats`. The `CSTP-*` Lambdas also rely on code defaults (`SIGNS_TABLE`, `AVATARS_TABLE`).

## 3. DynamoDB tables

| Table | Key | What it stores | Read or written by |
|---|---|---|---|
| `cs_avatars` | `avatarID` | Live state of each avatar: `status` (`loading` / `noChat` / `inChat` / `done`), `partnerID`, `chatID`, `updatedAt`, `lastPeriodicUpdateAt` | CSTP-addAvatar, CSTP-patch, CSTP_getAllStatuses, CSTP_checkAndUpdate, cs_startChat, cs_create_avatar, cs_disconnect |
| `cs_signs` | `avatarID` | The participant's "sign" profile: `userName`, `address`, `isMan`, `isDriver`, `isPassenger`, `isLoading`, `day1to`…`day5back` (commute times), `createdAt`, `updatedAt` | CSTP-addAvatar, CSTP-patch, CSTP_getAllStatuses |
| `cs_chats` | `chatID` | One chat per avatar pair: `participants`, `startTime`, `endTime`, `chatText`, `dealResult`, `updatedAt` | cs_startChat |
| `PendingRetries` | `connectionId` + `messageId` | WebSocket messages waiting for the client to acknowledge them: `payload`, `retryCount`, `timestamp` | cs_create_avatar, cs_disconnect, RetrySender |
| `cs_avatarsURLplace` | — | Free position and URL slots for avatars | Only set as `URLS_TABLE_NAME` on `cs_create_avatar`. The current code doesn't use it; only `examples/cs_createAvatar*.py` does |

## 4. Other carshare Lambdas in the account (not wired to an API)

`cs_delete`, `cs_populate_avatars`, `cs_populate_xz`, and `cs_show_test_avatars_will_OVERWRIGHT_data` are utility or test Lambdas with no API Gateway route. Their code is not in this repo. As the name says, the last one overwrites data.

## 5. Not part of this app

The same AWS account also hosts the Lego project: the `lego_Couples` WebSocket API, the `logorest` and `api2dbPy-API` REST APIs, the `lego_*`, `initUser` and `logo_connect` Lambdas, and the `lego_*`, `modelStep` and `modelStagesTable` tables. `lego1.js`, `avatar.js` and `students.js` call `logorest` (`9ewp86ps3e`). The `carShare` WebSocket API (`2e4fsg7p3h`) has no routes and appears unused.
