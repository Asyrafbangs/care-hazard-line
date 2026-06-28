# Phase 2B Report: Supabase Storage Conversion

## Goal
Convert hazard photo storage from Cloudinary to Supabase Storage so the system uses Supabase for database, authentication, and photo storage.

## Files changed
- `components/ReportFlow.tsx`
- `app/api/storage/hazard-photo/route.ts`
- `app/api/reports/submit/route.ts`
- `app/api/cloudinary/signature/route.ts`
- `app/dashboard/page.tsx`
- `.env.example`
- `package.json`
- `database/migrations/phase_2b_supabase_storage.sql`

## Database changes
Run `database/migrations/phase_2b_supabase_storage.sql` in Supabase SQL Editor.

The migration creates a private Supabase Storage bucket:
- `hazard-photos`

It also updates `hazard_photos` to support Supabase Storage fields:
- `storage_provider`
- `supabase_bucket`
- `supabase_storage_path`
- `original_file_name`
- `mime_type`
- `size_bytes`

The previous Cloudinary columns are made nullable for backward compatibility.

## UI changes
The reporting flow now uploads the selected hazard photo to Supabase Storage before submitting the report record.

## Storage behavior
The bucket is private. The database stores the bucket name and storage path, not a public Cloudinary URL.

A signed URL is generated after upload for immediate response only. Permanent access should be handled through server-side signed URL generation in later report detail screens.

## Language storage
No change. Language remains stored at reporter and report level.

## Missing translation fallback
No change. Missing translations continue to fall back to English through `lib/i18n.ts`.

## Test result expected
- `npm install`
- `npm audit` returns `0 vulnerabilities`
- `npm run build` passes
- Uploading a report creates:
  - one file in Supabase Storage bucket `hazard-photos`
  - one record in `hazard_reports`
  - one record in `hazard_photos` with Supabase bucket and path

## Known limitations
- Report detail page does not yet display the stored photo.
- Photo retrieval will require a signed URL endpoint in a later phase.
- Current file size limit is 5 MB.
- Accepted image types are JPG, PNG, WEBP, HEIC, and HEIF.
