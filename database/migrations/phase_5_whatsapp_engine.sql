-- Phase 5: WhatsApp webhook conversation engine tables.
-- Run once in Supabase SQL Editor before testing /api/whatsapp/webhook or /whatsapp/simulator.

create table if not exists public.whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null unique,
  reporter_id uuid references public.reporters(id) on delete set null,
  state text not null default 'main_menu' check (
    state in (
      'await_language',
      'await_name',
      'await_category',
      'await_employee_id',
      'await_company_name',
      'await_consent',
      'main_menu',
      'await_description',
      'await_photo',
      'await_location',
      'await_urgency',
      'await_ai_confirmation',
      'await_status_report'
    )
  ),
  selected_language text not null default 'en' check (selected_language in ('en', 'ms', 'ne', 'my', 'bn')),
  context jsonb not null default '{}'::jsonb,
  last_inbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_message_logs (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null,
  message_text text,
  payload jsonb,
  status text not null default 'received' check (status in ('received', 'sent', 'failed', 'skipped')),
  created_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_sessions_phone_number on public.whatsapp_sessions(phone_number);
create index if not exists idx_whatsapp_message_logs_phone_created on public.whatsapp_message_logs(phone_number, created_at desc);
