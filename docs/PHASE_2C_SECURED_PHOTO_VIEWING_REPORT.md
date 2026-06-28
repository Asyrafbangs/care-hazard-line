# Phase 2C Report - Secured Photo Viewing

## Goal

Enable secure viewing of hazard photos stored in private Supabase Storage.

Phase 2B proved upload works. Phase 2C makes the uploaded photo viewable from the EHS dashboard without exposing a permanent public URL.

## Files changed

- `app/api/storage/signed-url/route.ts`
- `app/dashboard/reports/[reportNo]/page.tsx`
- `components/SecurePhotoPreview.tsx`
- `components/ReportCard.tsx`
- `docs/PHASE_2C_SECURED_PHOTO_VIEWING_REPORT.md`

## Database changes

No schema change required.

Phase 2C uses the existing `hazard_photos` fields introduced in Phase 2B:

- `storage_provider`
- `supabase_bucket`
- `supabase_storage_path`
- `original_file_name`
- `mime_type`
- `size_bytes`

## UI changes

### Dashboard

Report cards now link to a secure report detail page:

`/dashboard/reports/[reportNo]`

### Report detail page

The EHS detail page shows:

- hazard summary
- status
- location
- AI category and recommended action
- reporter name and phone number, visible to EHS only
- private photo evidence viewer
- stored photo metadata

### Secure photo viewer

The photo is not loaded directly from a public URL.

The user clicks `View photo`, then the browser calls:

`POST /api/storage/signed-url`

The API returns a temporary signed URL valid for 5 minutes.

## Privacy handling

The signed URL API selects the database view based on viewer role:

- `ehs_report_detail` for EHS viewing
- `action_owner_report_detail` for action owner viewing

For Phase 2C, full authentication and role enforcement is not completed yet. The route is structured for later Supabase Auth role checks.

Important privacy rule remains:

Action owner screens must not display reporter name or phone number.

## How selected language is stored

No change from Phase 2A/2B.

Selected language is stored at:

- `reporters.preferred_language`
- `language_preferences.language_code`
- `hazard_reports.selected_language`

## How missing translation is handled

No change from Phase 1.

The app uses `lib/i18n.ts`. If a translation key is missing, English is used as fallback.

## Test result target

Expected local tests:

- `npm audit` returns 0 vulnerabilities
- `npm run build` passes
- Dashboard report card opens detail page
- Detail page loads report data
- Clicking `View photo` displays photo from Supabase Storage
- The signed photo link expires after around 5 minutes

## Manual test steps

1. Start dev server:

```powershell
npm run dev
```

2. Open dashboard:

```text
http://localhost:3000/dashboard
```

3. Click a report card with a Supabase Storage photo.

4. On the detail page, click:

```text
View photo
```

5. Confirm the photo is displayed.

6. Confirm there is no public permanent image URL stored in the page source.

7. Build test:

```powershell
npm audit
npm run build
```

## Known limitations

- Full Supabase Auth role enforcement is not implemented yet.
- The detail page is currently EHS-focused.
- Action owner-specific report detail page will be completed in a later phase.
- Signed URL access is role-structured but not yet tied to authenticated user claims.

## What to review next

- Whether the signed URL expiry should remain 5 minutes or be changed to 10 minutes.
- Whether report detail page should show reporter phone number by default or require a click-to-reveal for EHS.
- Whether action owner detail should be built next or EHS assignment workflow should come first.
