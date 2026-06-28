# CARE Hazard Line

Mobile-first hazard reporting system with WhatsApp-style flow and web application backend.

## Phase 1 scope

This package contains the foundation implementation:

- Next.js 15 App Router project structure
- React 19 + TypeScript + Tailwind CSS setup
- Mobile-first PWA manifest
- Supabase client/server helper structure
- Supabase Postgres schema with dummy master data
- Cloudinary signed-upload route structure
- AI hazard summary route with safe fallback logic
- WhatsApp webhook verification placeholder
- Demo pages for reporting flow, EHS dashboard, login, and admin settings
- Multilingual message structure for English, Bahasa Melayu, Nepali, Myanmar, and Bengali

## Quick start

1. Copy `.env.example` to `.env.local`.
2. Fill in Supabase and Cloudinary values.
3. Install dependencies.

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000`.
5. Run `database/schema.sql` in the Supabase SQL Editor.

## Important Phase 1 notes

- The reporting page currently performs demo submission only. Phase 2 will persist reports to Supabase and upload photos to Cloudinary.
- AI summary uses deterministic fallback logic if no AI key is configured.
- Reporter language is designed to be stored at reporter level through `reporters.preferred_language` and `language_preferences`.
- Action owner privacy is supported through `action_owner_report_detail`, which excludes reporter name and phone number.
- Real WhatsApp Cloud API sending is not active yet. The webhook endpoint is prepared for future connection.

## Main routes

- `/` Worker landing page
- `/reports/new` Mobile-first hazard reporting demo flow
- `/auth/login` Supabase Auth login placeholder
- `/dashboard` EHS dashboard demo
- `/admin/settings` Dummy master data settings view
- `/api/health` Environment and system health check
- `/api/ai/hazard-summary` AI summary fallback endpoint
- `/api/cloudinary/signature` Cloudinary signed upload signature endpoint
- `/api/whatsapp/webhook` WhatsApp webhook placeholder
