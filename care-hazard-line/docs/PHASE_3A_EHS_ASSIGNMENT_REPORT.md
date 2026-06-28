# Phase 3A Report - EHS Report Detail and Assignment Workflow

## Goal

Build the first working EHS assignment workflow after a hazard report has been submitted and photo evidence is securely viewable.

Phase 3A allows EHS to:

1. open a submitted report,
2. review the reporter details, AI summary, hazard photo, and location,
3. confirm final urgency and category,
4. assign an action owner,
5. set the required action and due date,
6. update the report status to `assigned`,
7. create a status history record,
8. create an in-app notification placeholder for the action owner.

## Files changed

```text
app/api/reports/assign/route.ts
app/dashboard/reports/[reportNo]/page.tsx
components/EhsAssignmentPanel.tsx
docs/PHASE_3A_EHS_ASSIGNMENT_REPORT.md
```

## Database changes

No database migration is required.

This phase uses existing tables:

```text
hazard_reports
hazard_categories
action_owners
report_assignments
status_history
notifications
users
departments
```

## UI changes

The EHS report detail page now includes an EHS assignment panel.

The panel supports:

- final urgency selection,
- final category selection,
- action owner selection,
- required action text,
- due date,
- optional EHS comment,
- update of existing active assignment.

## API changes

New route:

```text
POST /api/reports/assign
```

Payload:

```json
{
  "reportNo": "HZ-2026-0001",
  "finalUrgency": "medium",
  "finalCategoryId": "uuid-or-null",
  "actionOwnerId": "uuid",
  "actionRequired": "Clear the blocked walkway and review storage control.",
  "dueDate": "2026-07-05",
  "ehsComment": "Optional internal note",
  "assignedByUserId": null
}
```

Response:

```json
{
  "ok": true,
  "reportNo": "HZ-2026-0001",
  "assignmentId": "uuid",
  "status": "assigned",
  "finalUrgency": "medium",
  "finalCategoryName": "Housekeeping / Access"
}
```

## Privacy control

The EHS report detail page uses `ehs_report_detail`, so EHS can see reporter name and phone number.

The action owner notification created in this phase does not include reporter name or phone number.

Action owner views must continue to use `action_owner_report_detail`, not `ehs_report_detail`.

## Language storage

No change in this phase.

Reporter language remains stored at:

```text
reporters.preferred_language
language_preferences.language_code
hazard_reports.selected_language
```

## Missing translation fallback

No change in this phase.

The app continues to use the existing fallback pattern in:

```text
lib/i18n.ts
```

Missing translations fall back to English.

## Test result expected

Run:

```powershell
npm audit
npm run build
npm run dev
```

Expected:

```text
found 0 vulnerabilities
Compiled successfully
```

Manual workflow:

1. Open `/dashboard`.
2. Open a report detail page.
3. Confirm the hazard photo still loads using secure signed URL.
4. Select final urgency.
5. Select final category.
6. Select action owner.
7. Write or accept required action.
8. Set due date.
9. Click Assign action owner.
10. Confirm success message.
11. Refresh page.
12. Confirm current assignment is shown.

## Supabase verification SQL

```sql
select report_no, status, final_urgency, final_category_id, updated_at
from public.hazard_reports
order by updated_at desc;
```

```sql
select ra.id, hr.report_no, ra.action_required, ra.due_date, ra.status, ra.created_at
from public.report_assignments ra
join public.hazard_reports hr on hr.id = ra.report_id
order by ra.created_at desc;
```

```sql
select hr.report_no, sh.old_status, sh.new_status, sh.comment, sh.created_at
from public.status_history sh
join public.hazard_reports hr on hr.id = sh.report_id
order by sh.created_at desc;
```

```sql
select recipient_type, channel, template_key, message_preview, status, created_at
from public.notifications
order by created_at desc;
```

## Known limitations

- Real Supabase Auth role enforcement is not fully wired yet.
- `assignedByUserId` is temporarily `null` until login is connected to internal users.
- Action owner dashboard is not built yet.
- Action owner notification is an in-app placeholder only.
- Email or WhatsApp notification sending is not active yet.
- Extension request, owner update, and EHS close-out verification are not included in this phase.

## Next recommended phase

Phase 3B: Action Owner Dashboard.

Build:

- action owner assigned action list,
- privacy-safe report detail using `action_owner_report_detail`,
- update status to `in_progress`,
- submit completion for EHS verification,
- owner comment log.
