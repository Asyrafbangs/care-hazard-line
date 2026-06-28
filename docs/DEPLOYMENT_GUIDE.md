# Deployment Guide

## 1. Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `database/schema.sql`.
4. Enable email/password auth.
5. Create actual EHS/action-owner login accounts.
6. Link `public.users.auth_user_id` to the created Supabase Auth user IDs.

## 2. Cloudinary setup

1. Create a Cloudinary account.
2. Copy cloud name, API key, and API secret.
3. Use folder `care-hazard-line/hazards` for hazard photos.
4. Add values into `.env.local` locally and Vercel environment variables later.

## 3. Vercel setup

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Add environment variables from `.env.example`.
4. Deploy.

## 4. WhatsApp setup, future phase

1. Create official WhatsApp Business account for this project.
2. Configure webhook URL:

```text
https://your-vercel-domain.vercel.app/api/whatsapp/webhook
```

3. Set verify token to match `WHATSAPP_VERIFY_TOKEN`.
4. Future phases will parse incoming messages and send outbound templates.

## 5. Production hardening before go-live

- Tighten RLS policies.
- Enforce role-based dashboards.
- Move public reporting submission through secure route handlers.
- Validate translations.
- Review PDPA notice.
- Add rate limiting for public endpoints.
- Add file type and file size validation for Cloudinary uploads.
- Add audit log for every status change.
