# Phase 4A + 4B Report: Reporter Progress Tracking and Supabase Auth Role Access

## Goal

Phase 4 completes two major items:

1. Reporter progress tracking and closure update visibility.
2. Supabase Auth email/password login with role-based access control for EHS and action owners.

## Files changed

- `app/track/page.tsx`
- `app/api/reports/status/route.ts`
- `components/ReporterTrackFlow.tsx`
- `app/auth/login/page.tsx`
- `app/auth/logout/route.ts`
- `app/auth/unauthorized/page.tsx`
- `components/LoginForm.tsx`
- `lib/auth.ts`
- `app/page.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/reports/[reportNo]/page.tsx`
- `app/dashboard/verification/page.tsx`
- `app/admin/settings/page.tsx`
- `app/actions/page.tsx`
- `app/actions/[assignmentId]/page.tsx`
- `app/api/reports/list/route.ts`
- `app/api/reports/assign/route.ts`
- `app/api/reports/verify/route.ts`
- `app/api/actions/list/route.ts`
- `app/api/actions/update/route.ts`
- `app/api/storage/signed-url/route.ts`
- `app/api/storage/action-evidence/route.ts`

## Database changes

No table migration is required.

The existing `public.users.auth_user_id` field is now used. When a user logs in successfully, the app automatically links the Supabase Auth user ID to the matching record in `public.users` by email.

## UI changes

### Reporter tracking

New page:

```text
/track
```

Reporter can check progress by entering:

- phone number
- optional report ID

The page shows:

- report number
- summary
- location
- current status
- assigned action status
- due date
- status history
- reporter notification / closure update placeholder

### Auth login

New login behavior:

```text
/auth/login
```

Internal users sign in using Supabase Auth email/password.

### Unauthorized page

New page:

```text
/auth/unauthorized
```

Shown when user is logged in but does not have the required role.

### Logout

New route:

```text
/auth/logout
```

Signs out and returns to login page.

## Role access rules

| Route | Allowed roles |
|---|---|
| `/dashboard` | admin, ehs, hod |
| `/dashboard/reports/[reportNo]` | admin, ehs, hod |
| `/dashboard/verification` | admin, ehs, hod |
| `/admin/settings` | admin, ehs |
| `/actions` | admin, ehs, action_owner |
| `/actions/[assignmentId]` | admin, ehs, action_owner |

For action owners, the system checks the linked `action_owners` record and only shows assigned actions for that owner.

## API access rules

| API | Access rule |
|---|---|
| `/api/reports/status` | Public reporter tracking by phone number |
| `/api/reports/list` | EHS role required |
| `/api/reports/assign` | EHS role required |
| `/api/reports/verify` | EHS role required |
| `/api/actions/list` | Internal login required; action owner sees own queue only |
| `/api/actions/update` | Internal login required; action owner must own the assignment |
| `/api/storage/signed-url` | Internal login required; EHS/action-owner visibility enforced |
| `/api/storage/action-evidence` | Internal login required |

## Closure update behavior

When EHS closes a report, the system now creates reporter notifications:

- `channel = in_app`
- `channel = whatsapp`
- `template_key = report_closed_update` or `report_closed_whatsapp_update`

WhatsApp sending is still a placeholder. The notification record is ready for the future WhatsApp message sender.

## How selected language is stored

No change from earlier phases.

Language remains stored at:

- `reporters.preferred_language`
- `language_preferences.language_code`
- `hazard_reports.selected_language`

Reporter tracking returns reporter preferred language so the future WhatsApp status reply can use the correct language.

## Missing translation fallback

No change from earlier phases.

If translation is missing, the current app-level fallback remains English through `lib/i18n.ts`.

## Supabase Auth setup needed

Create Supabase Auth users manually in:

```text
Supabase Dashboard → Authentication → Users → Add user
```

Use these emails from the dummy `public.users` table:

```text
ehs.admin@example.com
ehs.reviewer@example.com
maintenance.supervisor@example.com
facilities.executive@example.com
warehouse.supervisor@example.com
production.manager@example.com
```

Set any temporary password for local testing.

On first successful login, the app will auto-link:

```text
auth.users.id → public.users.auth_user_id
```

based on matching email.

## Manual test steps

1. Create Supabase Auth user for `ehs.admin@example.com`.
2. Create Supabase Auth user for one action owner, for example `maintenance.supervisor@example.com`.
3. Run:

```bash
npm audit
npm run build
npm run dev
```

4. Open `/auth/login` and login as EHS.
5. Confirm EHS can open `/dashboard`, `/dashboard/verification`, and report detail pages.
6. Logout.
7. Login as action owner.
8. Confirm action owner can open `/actions`.
9. Confirm action owner cannot open `/dashboard`.
10. Confirm action owner cannot see reporter name or phone number.
11. Open `/track`.
12. Enter reporter phone number used during report submission.
13. Confirm report status and closure update placeholder are visible.

## Known limitations

- Supabase Auth users must be created manually first.
- Password reset flow is not built yet.
- Full RLS policies are not tightened yet because server route handlers still use service role after page/API auth checks.
- WhatsApp sending is not active yet; closure update records are stored as notification placeholders.
- Reporter status tracking uses phone number only for MVP. Later this should add OTP or secure WhatsApp identity confirmation for stronger protection.

## Recommended next phase

Phase 5 should be WhatsApp webhook conversation engine:

- identify returning reporter by WhatsApp number
- first-time registration flow
- report status reply through WhatsApp
- send closure updates from notification queue
- send urgent EHS alert notification

