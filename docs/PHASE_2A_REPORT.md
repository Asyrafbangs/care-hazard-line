# Phase 2A Report - Supabase Real Reporting

## Goal

Connect the mobile reporting flow to the real Supabase database before adding Cloudinary upload.

This phase proves that `/reports/new` can create real records in:

- reporters
- language_preferences
- hazard_reports
- hazard_photos
- status_history
- notifications, for urgent/high reports

## Files changed

- `components/ReportFlow.tsx`
- `app/dashboard/page.tsx`
- `app/api/db-check/route.ts`
- `app/api/reports/submit/route.ts`
- `app/api/reports/list/route.ts`
- `lib/supabase-admin.ts`
- `lib/report-number.ts`
- `docs/PHASE_2A_REPORT.md`

## Database changes

No schema change in Phase 2A.

This phase uses the existing Phase 1 tables:

- `reporters`
- `language_preferences`
- `hazard_reports`
- `hazard_photos`
- `status_history`
- `notifications`
- `locations`
- `ehs_report_detail`

## UI changes

### `/reports/new`

The reporting form now submits to Supabase instead of generating a demo report number.

The form captures:

- preferred language
- reporter name
- phone number
- employee / visitor category
- optional employee ID
- optional visitor company name
- hazard description
- mandatory photo selection
- location
- AI summary
- reporter confirmation

### `/dashboard`

The dashboard now reads from Supabase using `ehs_report_detail`.

If Supabase cannot be reached, it falls back to dummy data and shows a visible warning.

## Photo handling

Cloudinary is not active yet in Phase 2A.

The selected photo is mandatory, but only a temporary pending photo reference is stored in `hazard_photos`:

- `cloudinary_public_id`: `phase-2a-pending/<report_no>/<filename>`
- `cloudinary_url`: `pending-cloudinary://<report_no>/<filename>`

Phase 2B will replace this with real Cloudinary upload.

## How selected language is stored

Selected language is stored in:

- `reporters.preferred_language`
- `language_preferences.language_code`
- `hazard_reports.selected_language`

## How missing translation is handled

The existing `lib/i18n.ts` fallback remains unchanged.

If a translation key is missing, the app falls back to English and does not break the page.

## Test result expected

After applying this patch and running `npm run dev`, these should work:

- `/api/db-check` returns database connected
- `/reports/new` submits a real report
- `/dashboard` shows the submitted report
- Supabase tables receive new rows

## Manual test steps

1. Confirm `.env.local` contains:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

2. Run:

```powershell
npm run dev
```

3. Open:

```text
http://localhost:3000/api/db-check
```

Expected response:

```json
{
  "ok": true,
  "database": "connected"
}
```

4. Open:

```text
http://localhost:3000/reports/new
```

5. Submit a test report.

6. Check Supabase tables:

```sql
select report_no, status, ai_hazard_summary, ai_urgency, created_at
from public.hazard_reports
order by created_at desc;
```

7. Check dashboard:

```text
http://localhost:3000/dashboard
```

## Known limitations

- Cloudinary upload is not active yet.
- Uploaded image file content is not stored yet.
- WhatsApp bot message handling is still placeholder.
- Supabase Auth login is not enforced yet.
- Dashboard uses service role through server-side code for this prototype phase.
- Employee ID and visitor company are optional in Phase 2A.
- Report number generation is simple and good for testing, but should be hardened against simultaneous submissions before production.

## What to review next

1. Confirm whether the real report appears in Supabase.
2. Confirm whether dashboard loads Supabase reports.
3. Confirm whether employee ID should become mandatory.
4. Confirm whether visitor company name should become mandatory.
5. Prepare Cloudinary credentials for Phase 2B.
