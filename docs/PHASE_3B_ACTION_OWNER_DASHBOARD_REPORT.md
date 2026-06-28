# Phase 3B Report - Action Owner Dashboard

## Goal

Build a privacy-safe action owner dashboard where assigned owners can view their assigned hazard actions, review hazard details and photo evidence, update progress, and submit actions for EHS verification without seeing reporter identity.

## Files changed

- `app/actions/page.tsx`
- `app/actions/[assignmentId]/page.tsx`
- `app/api/actions/list/route.ts`
- `app/api/actions/update/route.ts`
- `components/ActionOwnerUpdatePanel.tsx`
- `app/page.tsx`
- `docs/PHASE_3B_ACTION_OWNER_DASHBOARD_REPORT.md`

## Database changes

No database migration is required for Phase 3B. This phase uses existing tables and views:

- `action_owner_report_detail`
- `report_assignments`
- `action_updates`
- `hazard_reports`
- `hazard_photos`
- `status_history`
- `notifications`

## UI changes

### New `/actions` page

Action owner dashboard with:

- temporary action owner selector
- assigned action list
- due date
- action status
- overdue indicator
- privacy reminder

The owner selector is temporary until Supabase Auth role-based routing is completed.

### New `/actions/[assignmentId]` page

Action detail page with:

- hazard details
- required action
- due date
- secure photo viewing
- update history
- action update form

Reporter name, phone number, employee ID, and company name are not displayed.

## API changes

### `GET /api/actions/list`

Returns privacy-safe assigned actions. Optional query:

```text
/api/actions/list?ownerId=<action_owner_id>
```

### `POST /api/actions/update`

Updates assignment progress and report status.

Accepted statuses:

- `in_progress`
- `pending_verification`

When owner submits `pending_verification`, the system:

- updates `report_assignments.status`
- updates `hazard_reports.status`
- inserts an `action_updates` record
- inserts a `status_history` record if report status changed
- creates a pending EHS notification placeholder

## Privacy handling

Action owner pages use `action_owner_report_detail`, which does not include:

- reporter name
- reporter phone number
- employee ID
- visitor company name

Photo viewing uses the existing signed URL endpoint with `viewerRole = action_owner`.

## Language handling

No new translation structure was added in this phase. Existing language storage remains:

- `reporters.preferred_language`
- `language_preferences.language_code`
- `hazard_reports.selected_language`

Missing translation fallback remains handled by `lib/i18n.ts`.

## Test result expected

1. EHS assigns a report in Phase 3A.
2. Open `/actions`.
3. Select the assigned action owner.
4. Open the assigned action.
5. Confirm reporter details are not visible.
6. Click `View photo` and confirm secure photo loads.
7. Save action as `In progress`.
8. Submit action as `Ready for EHS verification`.
9. Confirm Supabase rows are updated.

## Manual SQL checks

```sql
select assignment_id, report_no, action_required, due_date, assignment_status, action_owner_id
from public.action_owner_report_detail
order by due_date asc;
```

```sql
select ra.id, hr.report_no, ra.status, ra.updated_at
from public.report_assignments ra
join public.hazard_reports hr on hr.id = ra.report_id
order by ra.updated_at desc;
```

```sql
select au.assignment_id, au.status, au.comment, au.created_at
from public.action_updates au
order by au.created_at desc;
```

```sql
select hr.report_no, sh.old_status, sh.new_status, sh.comment, sh.created_at
from public.status_history sh
join public.hazard_reports hr on hr.id = sh.report_id
order by sh.created_at desc;
```

## Known limitations

- The action owner selector is temporary and should be replaced with Supabase Auth role scoping.
- Closure evidence upload is not included yet. It should be Phase 3C.
- Extension request and escalation reminder logic are not included yet.
- Full RLS hardening is still later.

## Recommended next phase

Phase 3C: closure evidence and EHS verification.

Suggested scope:

- action owner uploads closure photo
- completion status requires closure evidence
- EHS pending verification dashboard
- EHS accepts closure or rejects back to owner
- status moves to `closed` or `reopened`
