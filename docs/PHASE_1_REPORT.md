# Phase 1 Implementation Report

## Phase completed
Phase 1: Foundation setup.

## Files changed / created

```text
care-hazard-line/
├── app/
│   ├── api/ai/hazard-summary/route.ts
│   ├── api/cloudinary/signature/route.ts
│   ├── api/health/route.ts
│   ├── api/whatsapp/webhook/route.ts
│   ├── admin/settings/page.tsx
│   ├── auth/login/page.tsx
│   ├── dashboard/page.tsx
│   ├── reports/new/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── LanguageSelector.tsx
│   ├── MetricCard.tsx
│   ├── MobileShell.tsx
│   ├── ReportCard.tsx
│   └── ReportFlow.tsx
├── database/schema.sql
├── docs/PROJECT_PLAN.md
├── docs/PHASE_1_REPORT.md
├── lib/
│   ├── ai.ts
│   ├── dummy-data.ts
│   ├── env.ts
│   ├── i18n.ts
│   ├── status.ts
│   ├── supabase-client.ts
│   └── supabase-server.ts
├── public/icon.svg
├── public/manifest.webmanifest
├── types/domain.ts
├── .env.example
├── package.json
├── README.md
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Database changes
Created `database/schema.sql` with these table groups:

- `users`
- `reporters`
- `hazard_reports`
- `hazard_photos`
- `locations`
- `departments`
- `hazard_categories`
- `ehs_users`
- `action_owners`
- `area_owner_mappings`
- `report_assignments`
- `action_updates`
- `status_history`
- `notifications`
- `language_preferences`
- `language_messages`
- `escalation_rules`

Dummy master data is included for:

- departments
- locations
- hazard categories
- escalation rules
- EHS users
- action owners
- reporters

Privacy-supporting views are included:

- `ehs_report_detail`: includes reporter details for EHS.
- `action_owner_report_detail`: excludes reporter name and phone number.

## UI changes
Created these early UI screens:

- Worker landing page
- Language selector preview
- Mobile-first hazard reporting demo flow
- EHS console login placeholder
- EHS dashboard with dummy reports
- Admin settings page showing dummy master data

## PDF changes
None.

## How selected language is stored
The selected language is designed to be stored at reporter level using:

- `reporters.preferred_language`
- `language_preferences.language_code`
- `hazard_reports.selected_language`

This means a returning reporter can continue in their preferred language.

## How missing translation is handled
The app uses `lib/i18n.ts`.

If translation is missing:

1. The system falls back to English.
2. The page does not break.
3. The function returns `usedFallback: true`, so the UI or log can show that English fallback was used.

## Test result
Static file creation completed.

Manual runtime dependency installation was not executed inside this package. Run this locally:

```bash
npm install
npm run dev
```

Then test the routes below.

## Manual test steps

1. Copy `.env.example` to `.env.local`.
2. Fill Supabase and Cloudinary environment values.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `/`.
6. Test language selector.
7. Open `/reports/new`.
8. Enter reporter name and phone number.
9. Select Employee or Visitor.
10. Enter hazard description.
11. Select a photo.
12. Select location.
13. Generate AI summary.
14. Confirm and submit demo report.
15. Open `/dashboard`.
16. Open `/admin/settings`.
17. Open `/api/health`.
18. In Supabase, run `database/schema.sql`.

## Known limitations

- Real Supabase Auth submit action is not wired yet.
- Report submission does not yet write into Supabase.
- Photo selection does not yet upload to Cloudinary from the UI.
- AI endpoint uses fallback logic unless an AI provider is added in Phase 2.
- WhatsApp webhook is a placeholder only.
- RLS policies are still Phase 1 baseline and must be tightened before production.
- Dummy translations must be validated by actual language users.

## What needs review next

1. Confirm system name: CARE Hazard Line or another name.
2. Confirm whether employee ID is mandatory for employees.
3. Confirm if visitor company name should be mandatory.
4. Confirm the hazard category list.
5. Confirm urgency due-date rules.
6. Validate multilingual messages.
7. Decide whether action owner can request extension.
8. Decide whether reporter can reopen a closed report.
