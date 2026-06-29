# Phase 5B Report: WhatsApp Production Connection

## Goal

Connect the existing WhatsApp conversation engine to a real Meta WhatsApp Cloud API production setup.

This phase does not replace the simulator. It adds production readiness tools for webhook verification, environment checking, live text test, approved template test, and pending WhatsApp notification processing.

## Files changed

```text
app/api/whatsapp/production-check/route.ts
app/api/whatsapp/test-send/route.ts
app/api/whatsapp/send-template/route.ts
app/api/whatsapp/send-pending/route.ts
app/whatsapp/production/page.tsx
components/WhatsAppProductionPanel.tsx
lib/whatsapp/send.ts
app/page.tsx
.env.example
docs/PHASE_5B_WHATSAPP_PRODUCTION_CONNECTION_REPORT.md
```

## Database changes

No database migration is required.

This phase uses existing Phase 5 tables:

```text
whatsapp_sessions
whatsapp_message_logs
notifications
reporters
users
```

## UI changes

Added:

```text
/whatsapp/production
```

The page shows:

- WhatsApp environment readiness
- webhook callback URL
- phone number information check
- live text test sender
- approved template test sender
- pending WhatsApp notification sender

## API changes

### GET /api/whatsapp/production-check

Checks local/Vercel WhatsApp configuration and returns the webhook callback URL.

### POST /api/whatsapp/test-send

Sends a live free-form WhatsApp text message.

Important: Meta only allows free-form service messages inside the permitted customer service window. For updates outside the window, use templates.

### POST /api/whatsapp/send-template

Sends an approved WhatsApp template message.

### POST /api/whatsapp/send-pending

Updated to support approved templates when `WHATSAPP_NOTIFICATION_TEMPLATE_NAME` is configured.

## Environment variables

Add these to `.env.local` for local testing and to Vercel for deployment:

```env
WHATSAPP_VERIFY_TOKEN=your-own-random-verify-token
WHATSAPP_ACCESS_TOKEN=your-permanent-system-user-token
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
WHATSAPP_GRAPH_API_VERSION=v23.0
WHATSAPP_EHS_ALERT_NUMBERS=60123456789,60198765432
WHATSAPP_DEFAULT_TEMPLATE_LANGUAGE=en_US
WHATSAPP_NOTIFICATION_TEMPLATE_NAME=care_hazard_update
CRON_SECRET=long-random-secret
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
APP_BASE_URL=https://your-vercel-domain.vercel.app
```

## Meta setup steps

1. Deploy the app to Vercel.
2. Open `/whatsapp/production`.
3. Copy the callback URL.
4. In Meta App Dashboard, open WhatsApp > Configuration.
5. Paste the callback URL.
6. Paste the same verify token as `WHATSAPP_VERIFY_TOKEN`.
7. Subscribe to the messages webhook field.
8. Add `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` into Vercel environment variables.
9. Redeploy Vercel.
10. Use `/whatsapp/production` to test the connection.

## Suggested template names

Create utility templates in Meta before using production outbound updates.

### Template: care_hazard_update

Suggested body:

```text
CARE Hazard Line update: {{1}}
```

Use this generic template for status and closure update previews.

### Template: care_hazard_closure

Suggested body:

```text
Your hazard report {{1}} has been closed. Thank you for helping improve workplace safety.
```

### Template: care_hazard_urgent_ehs

Suggested body:

```text
Urgent hazard report {{1}} requires EHS review. Please open the CARE Hazard Line dashboard.
```

## Language handling

WhatsApp production templates use Meta template language codes such as `en_US`.

The app still stores worker preferred language at reporter level. Template translation approval in Meta should be validated later for Bahasa Melayu, Nepali, Myanmar, and Bengali.

## Missing translation fallback

No change.

The current app-level language fallback still uses English where a translation is missing.

## Test result expected

```text
npm audit -> found 0 vulnerabilities
npm run build -> compiled successfully
/whatsapp/production -> loads
/api/whatsapp/production-check -> returns webhook URL and configuration check
```

## Manual test steps

### Local test

```powershell
npm audit
npm run build
npm run dev
```

Open:

```text
http://localhost:3000/whatsapp/production
```

### Production test after Vercel deployment

1. Open the Vercel `/whatsapp/production` page.
2. Confirm required WhatsApp variables are configured.
3. Copy callback URL.
4. Verify webhook in Meta.
5. Send a WhatsApp message to the business number.
6. Confirm the bot replies.
7. Check `whatsapp_message_logs` in Supabase.

## Known limitations

- Free-form text sending may fail outside the customer service window.
- Approved Meta templates are required for closure updates, reminders, and alerts outside the active window.
- The production page is a setup/admin utility and should be access-controlled before broad deployment.
- Final template wording must be reviewed before worker-facing launch.
- Real WhatsApp media download depends on a valid permanent access token.

## What Izzul needs to review or decide next

1. Confirm the production WhatsApp business number.
2. Create approved Meta templates.
3. Confirm EHS urgent alert recipient numbers.
4. Confirm Vercel production domain.
5. Decide whether `/whatsapp/production` should be hidden behind admin login before go-live.
