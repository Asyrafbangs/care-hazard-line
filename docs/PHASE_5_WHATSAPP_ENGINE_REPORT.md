# Phase 5 Report - WhatsApp Webhook Conversation Engine

## Goal

Build the first real WhatsApp conversation engine for CARE Hazard Line.

The engine allows a WhatsApp user to:

1. complete first-time profile setup,
2. choose language,
3. identify as employee or visitor,
4. accept privacy notice,
5. report hazard through guided conversation,
6. send mandatory photo,
7. provide location and urgency,
8. review AI hazard summary,
9. submit report into Supabase,
10. check report progress from WhatsApp.

## Files changed

- `app/api/whatsapp/webhook/route.ts`
- `app/api/whatsapp/simulate/route.ts`
- `app/api/whatsapp/send-pending/route.ts`
- `app/whatsapp/simulator/page.tsx`
- `components/WhatsAppSimulator.tsx`
- `lib/whatsapp/types.ts`
- `lib/whatsapp/messages.ts`
- `lib/whatsapp/send.ts`
- `lib/whatsapp/media.ts`
- `lib/whatsapp/engine.ts`
- `database/migrations/phase_5_whatsapp_engine.sql`
- `.env.example`
- `app/page.tsx`

## Database changes

Run:

```sql
-- database/migrations/phase_5_whatsapp_engine.sql
```

New tables:

### `whatsapp_sessions`

Stores conversation state per phone number.

Important fields:

- `phone_number`
- `reporter_id`
- `state`
- `selected_language`
- `context`
- `last_inbound_at`

### `whatsapp_message_logs`

Stores inbound and outbound WhatsApp messages for debugging and audit trail.

Important fields:

- `phone_number`
- `direction`
- `message_type`
- `message_text`
- `payload`
- `status`

## UI changes

Added local test page:

```text
/whatsapp/simulator
```

This allows conversation testing without connecting the official Meta WhatsApp account yet.

## API changes

### `GET /api/whatsapp/webhook`

Verifies Meta webhook subscription using:

```env
WHATSAPP_VERIFY_TOKEN
```

### `POST /api/whatsapp/webhook`

Receives WhatsApp webhook payload, extracts inbound messages, sends them into the conversation engine, and replies using WhatsApp Cloud API when configured.

### `POST /api/whatsapp/simulate`

Local simulator endpoint. It uses the same conversation engine, but does not send real WhatsApp messages.

### `POST /api/whatsapp/send-pending`

Sends pending WhatsApp notifications from the `notifications` table.

If `CRON_SECRET` is set, call this endpoint with:

```text
Authorization: Bearer <CRON_SECRET>
```

## Environment variables

Added:

```env
WHATSAPP_VERIFY_TOKEN=change-this-local-verify-token
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_API_VERSION=v23.0
WHATSAPP_EHS_ALERT_NUMBERS=
CRON_SECRET=
```

For local simulator testing, only Supabase values are required.

For real WhatsApp sending and media download, configure:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`

## Language storage

Language is stored in:

- `reporters.preferred_language`
- `whatsapp_sessions.selected_language`
- `language_preferences`

If a returning user changes language in WhatsApp, the engine updates the reporter preferred language and records a new language preference event.

## Missing translation fallback

The WhatsApp engine uses controlled multilingual prompts from `lib/whatsapp/messages.ts`.

Current structure supports:

- English
- Bahasa Melayu
- Nepali
- Myanmar
- Bengali

If a phrase is not translated yet, the engine falls back to simple English guidance.

## AI processing

The WhatsApp report flow uses the existing AI fallback engine:

```text
lib/ai.ts
```

AI generates:

- hazard summary,
- suggested category,
- urgency,
- recommended immediate action,
- suggested owner department.

The reporter must confirm AI summary before the report is created.

## Privacy controls

Reporter identity is saved in `reporters`, but action owner views still use privacy-safe views built in earlier phases.

WhatsApp status checking only returns reports linked to the same phone number.

## Manual test steps

1. Run migration:

```text
database/migrations/phase_5_whatsapp_engine.sql
```

2. Start app:

```powershell
npm run dev
```

3. Open:

```text
http://localhost:3000/whatsapp/simulator
```

4. Test first-time setup:

```text
hello
1
YES
1
SKIP
YES
```

5. Start report:

```text
1
pallet blocking walkway near loading area
```

6. Click `Send photo`.

7. Continue:

```text
Loading Area
3
1
```

8. Confirm Supabase:

```sql
select report_no, status, original_description, ai_hazard_summary, selected_language
from public.hazard_reports
order by created_at desc;
```

9. Check WhatsApp logs:

```sql
select phone_number, direction, message_type, message_text, status, created_at
from public.whatsapp_message_logs
order by created_at desc;
```

10. Check session:

```sql
select phone_number, state, selected_language, context, updated_at
from public.whatsapp_sessions
order by updated_at desc;
```

## Known limitations

- Real Meta WhatsApp setup still requires official WhatsApp Business configuration.
- The simulator uses a legacy placeholder photo record. Real WhatsApp image upload requires Meta media download access token.
- Interactive WhatsApp buttons are not yet sent. This phase uses simple numbered text replies for reliability.
- Message templates for business-initiated outbound messages still need Meta approval before production use.
- Production access hardening for the webhook endpoint should be reviewed before going live.

## What to review next

- Confirm exact WhatsApp language wording.
- Confirm official EHS alert numbers for urgent reports.
- Decide whether to send interactive buttons/lists in Phase 5B.
- Decide whether WhatsApp photo captions should be accepted as hazard description.
- Decide whether reporter can reopen report through WhatsApp.
