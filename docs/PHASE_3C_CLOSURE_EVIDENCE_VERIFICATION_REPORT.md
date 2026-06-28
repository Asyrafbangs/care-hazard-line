# Phase 3C Report: Closure Evidence and EHS Verification

## Goal

Complete the corrective-action loop after action owner assignment.

Action owner can now upload closure evidence and submit the action for EHS verification. EHS can review the evidence, then either close the report or reopen the action for rework.

## Files changed

- `app/api/storage/action-evidence/route.ts`
- `app/api/actions/update/route.ts`
- `app/api/reports/verify/route.ts`
- `app/actions/[assignmentId]/page.tsx`
- `app/dashboard/reports/[reportNo]/page.tsx`
- `app/dashboard/verification/page.tsx`
- `app/dashboard/page.tsx`
- `app/page.tsx`
- `components/ActionOwnerUpdatePanel.tsx`
- `components/EhsVerificationPanel.tsx`
- `docs/PHASE_3C_CLOSURE_EVIDENCE_VERIFICATION_REPORT.md`

## Database changes

No new migration is required.

Phase 3C uses existing tables and columns:

- `hazard_reports`
- `hazard_photos`
- `report_assignments`
- `action_updates`
- `status_history`
- `notifications`
- `action_owner_report_detail`
- `ehs_report_detail`

Closure evidence is stored as `hazard_photos.photo_type = 'closure'`.

## UI changes

### Action owner detail page

- Adds mandatory closure evidence upload when submitting as `pending_verification`.
- Shows uploaded closure evidence using secure signed URL preview.
- Keeps privacy message visible.
- Reporter name, phone number, employee ID, and visitor company remain hidden.

### EHS report detail page

- Shows closure evidence previews.
- Adds EHS verification panel.
- Allows EHS to accept and close or reject and reopen.
- Shows action update history and whether a closure photo was attached.

### EHS verification queue

New page:

- `/dashboard/verification`

This lists all actions where `assignment_status = 'pending_verification'`.

## API changes

### `POST /api/storage/action-evidence`

Uploads closure evidence to private Supabase Storage bucket.

Returns:

- bucket
- storage path
- file name
- MIME type
- size
- temporary signed URL for immediate preview

### `POST /api/actions/update`

Now supports `closurePhoto` when action owner submits for EHS verification.

Rules:

- `in_progress` requires comment only.
- `pending_verification` requires comment and closure evidence photo.
- Creates closure photo record in `hazard_photos`.
- Creates action update record in `action_updates`.
- Updates assignment and report status.
- Creates notification placeholder for EHS.

### `POST /api/reports/verify`

Allows EHS to:

- close report after accepting evidence
- reopen action if evidence/action is not sufficient

## Status movement

Action owner:

- `assigned` → `in_progress`
- `in_progress` → `pending_verification`

EHS verification:

- `pending_verification` → `closed`
- `pending_verification` → `reopened`

## Privacy control

Action owner still uses:

- `action_owner_report_detail`

Action owner does not see:

- reporter name
- reporter phone number
- employee ID
- visitor company

EHS still uses:

- `ehs_report_detail`

EHS can see reporter details.

## Language storage

No language storage change in this phase.

Language remains stored at reporter/report level from Phase 2A:

- `reporters.preferred_language`
- `language_preferences.language_code`
- `hazard_reports.selected_language`

## Missing translation fallback

No translation logic change in this phase.

Fallback remains controlled by `lib/i18n.ts`.

## Manual test steps

1. Submit a hazard report.
2. Assign it from the EHS detail page.
3. Open `/actions`.
4. Select action owner.
5. Open assigned action.
6. Save status as `In progress` with a comment.
7. Reopen the action page.
8. Select `Ready for EHS verification`.
9. Add closure comment.
10. Attach closure evidence photo.
11. Submit to EHS.
12. Open `/dashboard/verification`.
13. Open the pending report.
14. Click `View photo` on closure evidence.
15. Accept and close the report.
16. Repeat another test and reject/reopen to confirm reopened flow.

## Supabase verification queries

```sql
select report_no, status, closed_at, updated_at
from public.hazard_reports
order by updated_at desc;
```

```sql
select ra.id, hr.report_no, ra.status, ra.updated_at
from public.report_assignments ra
join public.hazard_reports hr on hr.id = ra.report_id
order by ra.updated_at desc;
```

```sql
select photo_type, storage_provider, supabase_bucket, supabase_storage_path, original_file_name, mime_type, size_bytes, created_at
from public.hazard_photos
order by created_at desc;
```

```sql
select au.assignment_id, au.status, au.comment, au.closure_photo_id, au.created_at
from public.action_updates au
order by au.created_at desc;
```

```sql
select hr.report_no, sh.old_status, sh.new_status, sh.comment, sh.created_at
from public.status_history sh
join public.hazard_reports hr on hr.id = sh.report_id
order by sh.created_at desc;
```

Expected results:

- closure evidence creates `hazard_photos.photo_type = 'closure'`
- owner verification submission sets report and assignment to `pending_verification`
- EHS acceptance sets report and assignment to `closed`
- EHS rejection sets report and assignment to `reopened`

## Known limitations

- Full Supabase Auth role enforcement is still not implemented.
- Temporary owner selector remains for testing.
- WhatsApp closure update is still a notification placeholder only.
- If Storage upload succeeds but database insert fails, an orphan storage file may remain. Cleanup tooling can be added later.
- Reopened action flow is basic; Phase 4 can add clearer rework assignment handling.

## Next recommended phase

Phase 4A: Role-based login and access control.

Alternative if continuing workflow first:

Phase 4A: Reporter progress tracking and closure update placeholder.
