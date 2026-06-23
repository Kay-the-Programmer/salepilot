# WhatsApp Messaging in the CRM

Customer-facing WhatsApp Business messaging, integrated into the standalone **CRM**
app (Discover → CRM). Modelled on Meta's "Jasper's Market" reference
(`whatsapp_demo/whatsapp-business-jaspers-market`): the backend owns the Cloud API
access token + webhook and sends via `POST /{phone_number_id}/messages`; the
frontend only ever talks to our own `/api/whatsapp/*` routes, so no Meta
credentials reach the browser.

This document is the **frontend ↔ backend contract**. Both sides are now
implemented — the frontend in this repo and the backend in `s-back` (see
"Backend status" below).

---

## What shipped in the frontend

| Area | File |
| --- | --- |
| Service wrapper | `services/whatsappService.ts` |
| Entitlement module `whatsapp_messaging` | `utils/entitlements.ts` |
| WhatsApp send channel (alongside SMS / Email) | `components/crm/SendMessageModal.tsx` |
| **WhatsApp** nav tab → hub with **Chats / New Message / Broadcast / Templates** | `components/crm/CrmWhatsApp.tsx` (+ `CrmInbox.tsx` embedded as Chats, `whatsappTemplates.ts`) |
| Wiring (status fetch, send, route) | `components/crm/CrmApp.tsx`, `Dashboard.tsx` |
| Channel-agnostic "Send Message" gate | `components/crm/CrmCustomerProfile.tsx` |

The CRM degrades gracefully when the backend isn't ready: the Inbox shows a
"premium add-on" upsell when the store lacks the module, and a "not connected"
notice when credentials are missing. Sends fail with a toast rather than crashing.

---

## Endpoints the frontend calls

All are under the existing `/api` base, scoped to the caller's current store via
the bearer token. `customer_phone` / `to` are **E.164** (e.g. `+260971234567`).

### `GET /whatsapp/status`  *(new)*
Lightweight, no-secrets connection state — analogous to `GET /sms/config`.
```jsonc
{
  "configured": true,            // server has access_token + phone_number_id
  "enabled": true,               // store owner toggled the integration on
  "entitled": true,              // store has the `whatsapp_messaging` module
  "displayPhoneNumber": "+260..." // business number, or null
}
```
`entitled` must reflect the store's `whatsapp_messaging` entitlement. The frontend
folds in its own entitlement flag defensively, but the backend is authoritative.

### `POST /whatsapp/send`  *(new / extend existing)*
Two shapes share this route:

**Outbound to a customer** (CRM "Send Message" modal):
```jsonc
// request
{ "to": "+260971234567", "message": "Hi Mensa, ...", "customerId": "cus_123" }
```
**Reply inside a thread** (Inbox chat window):
```jsonc
// request
{ "conversationId": "wac_456", "content": "On its way!" }
```
Both return:
```jsonc
{ "success": true, "conversationId": "wac_456", "messageId": "wamid.XXX", "status": "sent" }
```
On rejection (e.g. outside the 24-hour customer-service window) return
`success:false` with a human `message`; surface a `402 { module: "whatsapp_messaging" }`
if unentitled so the global paywall interceptor (`services/api.ts`) can offer an
upgrade.

Backend send mirrors `services/graph-api.js` from the demo:
```js
api.call('POST', [phone_number_id, 'messages'], {
  messaging_product: 'whatsapp',
  to,                       // recipient E.164
  type: 'text',
  text: { body: message },
});
```
Resolve (or create) the `WhatsAppConversation` for `to`, persist an `outbound`
`WhatsAppMessage`, and link `customerId` when provided.

### `GET /whatsapp/conversations`
Array of `WhatsAppConversation` (see `types.ts`), most-recent first. Already used
by the existing super-admin support desk; the CRM reuses it store-scoped.

### `GET /whatsapp/conversations/:id/messages`
Array of `WhatsAppMessage`, oldest first.

### `GET /whatsapp/messages?customerId=...`  *(new, optional)*
Recent messages for one customer — reserved for a profile timeline (not yet
rendered, safe to defer).

---

## Inbound webhook (mirrors the demo's `app.js`)

- `GET /whatsapp/webhook` — verification handshake: echo `hub.challenge` when
  `hub.verify_token` matches the stored verify token.
- `POST /whatsapp/webhook` — validate `x-hub-signature-256` (HMAC-SHA256 of the
  raw body with the app secret), then for each `entry[].changes[].value`:
  - `messages[]` → upsert the conversation, persist an `inbound`
    `WhatsAppMessage`, bump `last_message_at`. The CRM Inbox polls every 4s, so it
    appears automatically.
  - `statuses[]` → update the matching message `status`
    (`sent`/`delivered`/`read`/`failed`).

Optional: when `auto_reply_enabled`, generate an AI reply (Gemini) and send it
back, flagged `is_ai_generated: true` (the Inbox already renders an "AI" tag).

---

## Entitlement

`whatsapp_messaging` is a premium add-on module (ZMW 110/mo), registered in the
backend entitlements + catalog so stores can buy it à-la-carte, consistent with
`sms_messaging`. The send route 402s `{ module: "whatsapp_messaging" }` when the
store lacks it. Trial stores get it automatically (it's in `ALL_MODULES`), and the
Full plan bundles it.

> **⚠️ DEV OVERRIDE — currently FREE.** While the team builds/tests, the paywall
> is bypassed by a flag that **defaults to free**: backend `WHATSAPP_FREE`
> (`src/controllers/whatsapp.controller.ts`) and frontend `WHATSAPP_FREE`
> (`utils/entitlements.ts`, `VITE_WHATSAPP_FREE`). To re-enable billing, set
> `WHATSAPP_FREE=false` on the backend **and** `VITE_WHATSAPP_FREE=false` on the
> frontend. Until then, every store can use the WhatsApp CRM features regardless
> of entitlement.

---

## Backend status — implemented in `s-back`

| Change | File |
| --- | --- |
| `whatsapp_messaging` module id | `src/services/entitlements.service.ts` |
| Catalog seed + idempotent backfill (ZMW 110) | `src/services/catalog.service.ts` |
| Bundled into Full plan / trial | `src/services/plan-modules.ts` |
| `GET /whatsapp/status`, outbound `POST /whatsapp/send`, `GET /whatsapp/messages`, 402 gate, token masking | `src/controllers/whatsapp.controller.ts` |
| `/status` + `/messages` routes | `src/api/whatsapp.routes.ts` |
| `updateMessageStatus` (delivery ticks) | `src/services/whatsapp.service.ts` |
| Webhook `statuses[]` handling (sent→delivered→read) | `src/controllers/whatsapp.controller.ts` |
| `display_phone_number` column + idempotent migration | `src/init_db.ts` |

Reused as-is from the existing super-admin support desk: the signed inbound
webhook, conversation/message storage, AI auto-reply, and the Graph API
`sendTextMessage` (Cloud API v18.0). Access tokens are AES-encrypted at rest and
never returned to the browser. Store roles `admin` (full) and `staff`
(read + send) already hold the `messaging:*` permissions the routes require.

**To enable for a store:** grant the `whatsapp_messaging` module (trial, Full
plan, or Super Admin → Plans & Pricing), then connect Meta Cloud API credentials
in WhatsApp Settings. The CRM Inbox + Send-Message WhatsApp channel light up
automatically.
