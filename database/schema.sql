-- CARE Hazard Line - Phase 1 Supabase Postgres schema
-- Run this in Supabase SQL Editor for the first prototype database.

create extension if not exists pgcrypto;

-- =========================
-- Reference / master tables
-- =========================

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(area, name)
);

create table if not exists public.hazard_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  examples text,
  default_urgency text not null default 'medium' check (default_urgency in ('low', 'medium', 'high', 'urgent')),
  suggested_owner_department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'ehs', 'action_owner', 'hod', 'viewer')),
  department_id uuid references public.departments(id),
  phone_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ehs_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  alert_by_email boolean not null default true,
  alert_by_whatsapp boolean not null default false,
  is_primary_reviewer boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.action_owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  owner_level text not null default 'supervisor' check (owner_level in ('supervisor', 'manager', 'hod')),
  can_receive_whatsapp boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.area_owner_mappings (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  department_id uuid not null references public.departments(id),
  default_action_owner_id uuid references public.action_owners(id),
  escalation_hod_user_id uuid references public.users(id),
  created_at timestamptz not null default now(),
  unique(location_id, department_id)
);

create table if not exists public.escalation_rules (
  id uuid primary key default gen_random_uuid(),
  urgency text not null unique check (urgency in ('low', 'medium', 'high', 'urgent')),
  ehs_review_due_hours integer not null,
  owner_action_due_days integer not null,
  escalate_to_role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================
-- Reporter and language tables
-- =========================

create table if not exists public.reporters (
  id uuid primary key default gen_random_uuid(),
  whatsapp_id text unique,
  phone_number text not null unique,
  name text not null,
  category text not null check (category in ('employee', 'visitor')),
  employee_id text,
  company_name text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'ms', 'ne', 'my', 'bn')),
  identity_visibility text not null default 'ehs_only' check (identity_visibility in ('ehs_only', 'show_to_owner')),
  consent_accepted boolean not null default false,
  consent_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.language_preferences (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.reporters(id) on delete cascade,
  language_code text not null check (language_code in ('en', 'ms', 'ne', 'my', 'bn')),
  source text not null default 'reporter_selection',
  created_at timestamptz not null default now()
);

create table if not exists public.language_messages (
  id uuid primary key default gen_random_uuid(),
  message_key text not null,
  language_code text not null check (language_code in ('en', 'ms', 'ne', 'my', 'bn')),
  message_text text not null,
  is_validated boolean not null default false,
  created_at timestamptz not null default now(),
  unique(message_key, language_code)
);

-- =========================
-- Hazard reporting tables
-- =========================

create table if not exists public.hazard_reports (
  id uuid primary key default gen_random_uuid(),
  report_no text not null unique,
  reporter_id uuid not null references public.reporters(id),
  report_type text not null default 'hazard' check (report_type in ('hazard', 'near_miss', 'unsafe_act', 'unsafe_condition', 'environmental')),
  original_description text not null,
  translated_description text,
  selected_language text not null default 'en' check (selected_language in ('en', 'ms', 'ne', 'my', 'bn')),
  location_id uuid references public.locations(id),
  location_text text,
  ai_hazard_summary text,
  ai_category_id uuid references public.hazard_categories(id),
  ai_category_name text,
  ai_urgency text check (ai_urgency in ('low', 'medium', 'high', 'urgent')),
  ai_recommended_immediate_action text,
  ai_suggested_owner_department text,
  ai_status text not null default 'pending' check (ai_status in ('pending', 'completed', 'fallback', 'failed')),
  reporter_confirmed_ai_summary boolean not null default false,
  reporter_correction text,
  final_category_id uuid references public.hazard_categories(id),
  final_urgency text check (final_urgency in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'ehs_review', 'assigned', 'in_progress', 'pending_verification', 'closed', 'reopened', 'cancelled')),
  is_urgent_alert_sent boolean not null default false,
  submitted_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazard_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.hazard_reports(id) on delete cascade,
  cloudinary_public_id text not null,
  cloudinary_url text not null,
  photo_type text not null default 'hazard' check (photo_type in ('hazard', 'closure', 'verification')),
  uploaded_by_reporter_id uuid references public.reporters(id),
  uploaded_by_user_id uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.report_assignments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.hazard_reports(id) on delete cascade,
  action_owner_id uuid not null references public.action_owners(id),
  assigned_by_user_id uuid references public.users(id),
  action_required text not null,
  due_date date not null,
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'pending_verification', 'closed', 'reopened', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.action_updates (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.report_assignments(id) on delete cascade,
  updated_by_user_id uuid references public.users(id),
  status text not null check (status in ('in_progress', 'pending_verification', 'closed', 'reopened')),
  comment text,
  closure_photo_id uuid references public.hazard_photos(id),
  created_at timestamptz not null default now()
);

create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.hazard_reports(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by_user_id uuid references public.users(id),
  changed_by_reporter_id uuid references public.reporters(id),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.hazard_reports(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('reporter', 'ehs', 'action_owner', 'hod')),
  recipient_reporter_id uuid references public.reporters(id),
  recipient_user_id uuid references public.users(id),
  channel text not null check (channel in ('whatsapp', 'email', 'in_app')),
  template_key text,
  message_preview text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================
-- Privacy-aware views
-- =========================

create or replace view public.ehs_report_detail as
select
  hr.*,
  r.name as reporter_name,
  r.phone_number as reporter_phone_number,
  r.category as reporter_category,
  r.employee_id,
  r.company_name,
  r.preferred_language,
  l.area as location_area,
  l.name as location_name
from public.hazard_reports hr
join public.reporters r on r.id = hr.reporter_id
left join public.locations l on l.id = hr.location_id;

create or replace view public.action_owner_report_detail as
select
  hr.id,
  hr.report_no,
  hr.report_type,
  hr.original_description,
  hr.translated_description,
  hr.location_id,
  hr.location_text,
  l.area as location_area,
  l.name as location_name,
  hr.ai_hazard_summary,
  hr.ai_category_name,
  hr.ai_urgency,
  hr.final_urgency,
  hr.status,
  hr.created_at,
  ra.id as assignment_id,
  ra.action_required,
  ra.due_date,
  ra.status as assignment_status,
  ra.action_owner_id
from public.hazard_reports hr
left join public.locations l on l.id = hr.location_id
left join public.report_assignments ra on ra.report_id = hr.id;

-- =========================
-- Dummy master data
-- =========================

insert into public.departments (name) values
  ('EHS'), ('Maintenance'), ('Facilities'), ('Production'), ('Warehouse'), ('Logistics'), ('Security'), ('Engineering')
on conflict (name) do nothing;

insert into public.locations (area, name, description) values
  ('Warehouse', 'Main Warehouse', 'Material storage and staging area'),
  ('Logistics', 'Loading Area', 'Truck loading and unloading zone'),
  ('Production', 'Fabrication Area', 'Fabrication and metal work area'),
  ('Production', 'Paintshop', 'Chemical and painting process area'),
  ('Production', 'Testing Area', 'Product testing and FAT area'),
  ('Office', 'Office Area', 'Office and administration area'),
  ('Security', 'Guard House', 'Security checkpoint')
on conflict (area, name) do nothing;

insert into public.hazard_categories (name, examples, default_urgency, suggested_owner_department) values
  ('Housekeeping / Access', 'Blocked walkway, spill, poor storage', 'medium', 'Area owner / Supervisor'),
  ('Machine Safety', 'Missing guard, exposed moving part', 'high', 'Maintenance'),
  ('Electrical Safety', 'Damaged plug, exposed cable, open panel', 'high', 'Maintenance'),
  ('Chemical Safety', 'Unlabelled chemical, leak, poor storage', 'high', 'Area owner + EHS'),
  ('Working at Height', 'Unsafe ladder, missing edge protection', 'high', 'Maintenance / Facilities'),
  ('Material Handling', 'Unsafe stacking, pallet issue, lifting risk', 'medium', 'Warehouse / Logistics'),
  ('Fire / Emergency', 'Blocked extinguisher, blocked exit, alarm issue', 'urgent', 'Facilities + EHS'),
  ('PPE / Unsafe Act', 'No required PPE, unsafe behavior', 'medium', 'Supervisor'),
  ('Environmental', 'Waste issue, spill to drain, emission concern', 'medium', 'EHS'),
  ('Other', 'Hazard not covered by other categories', 'medium', 'EHS review required')
on conflict (name) do nothing;

insert into public.escalation_rules (urgency, ehs_review_due_hours, owner_action_due_days, escalate_to_role) values
  ('urgent', 1, 1, 'HOD + EHS Manager'),
  ('high', 4, 3, 'Department HOD'),
  ('medium', 24, 7, 'Department Manager'),
  ('low', 48, 14, 'Department Supervisor')
on conflict (urgency) do nothing;

-- Dummy internal users. Link auth_user_id later after creating Supabase Auth users.
insert into public.users (name, email, role, department_id, phone_number)
select 'EHS Admin', 'ehs.admin@example.com', 'ehs', d.id, '60120000001' from public.departments d where d.name = 'EHS'
on conflict (email) do nothing;

insert into public.users (name, email, role, department_id, phone_number)
select 'EHS Reviewer', 'ehs.reviewer@example.com', 'ehs', d.id, '60120000002' from public.departments d where d.name = 'EHS'
on conflict (email) do nothing;

insert into public.users (name, email, role, department_id, phone_number)
select 'Aiman Maintenance', 'maintenance.supervisor@example.com', 'action_owner', d.id, '60120000003' from public.departments d where d.name = 'Maintenance'
on conflict (email) do nothing;

insert into public.users (name, email, role, department_id, phone_number)
select 'Farah Facilities', 'facilities.executive@example.com', 'action_owner', d.id, '60120000004' from public.departments d where d.name = 'Facilities'
on conflict (email) do nothing;

insert into public.users (name, email, role, department_id, phone_number)
select 'Ravi Warehouse', 'warehouse.supervisor@example.com', 'action_owner', d.id, '60120000005' from public.departments d where d.name = 'Warehouse'
on conflict (email) do nothing;

insert into public.users (name, email, role, department_id, phone_number)
select 'Mei Production', 'production.manager@example.com', 'hod', d.id, '60120000006' from public.departments d where d.name = 'Production'
on conflict (email) do nothing;

insert into public.ehs_users (user_id, alert_by_email, alert_by_whatsapp, is_primary_reviewer)
select id, true, true, true from public.users where email = 'ehs.admin@example.com'
on conflict do nothing;

insert into public.ehs_users (user_id, alert_by_email, alert_by_whatsapp, is_primary_reviewer)
select id, true, false, false from public.users where email = 'ehs.reviewer@example.com'
on conflict do nothing;

insert into public.action_owners (user_id, owner_level, can_receive_whatsapp)
select id, 'supervisor', true from public.users where role = 'action_owner'
on conflict do nothing;

insert into public.area_owner_mappings (location_id, department_id, default_action_owner_id, escalation_hod_user_id)
select l.id, d.id, ao.id, hod.id
from public.locations l
join public.departments d on d.name = case
  when l.area = 'Warehouse' then 'Warehouse'
  when l.area = 'Logistics' then 'Logistics'
  when l.area = 'Office' then 'Facilities'
  when l.area = 'Security' then 'Security'
  else 'Production'
end
left join public.users owner_user on owner_user.department_id = d.id and owner_user.role = 'action_owner'
left join public.action_owners ao on ao.user_id = owner_user.id
left join public.users hod on hod.email = 'production.manager@example.com'
on conflict (location_id, department_id) do nothing;

insert into public.language_messages (message_key, language_code, message_text, is_validated) values
  ('welcome', 'en', 'Welcome. Report hazards quickly and safely.', true),
  ('welcome', 'ms', 'Selamat datang. Laporkan hazard dengan cepat dan selamat.', false),
  ('welcome', 'ne', 'स्वागत छ। जोखिम छिटो र सुरक्षित रूपमा रिपोर्ट गर्नुहोस्।', false),
  ('welcome', 'my', 'ကြိုဆိုပါတယ်။ အန္တရာယ်ကို လုံခြုံစွာ အမြန်တင်ပြပါ။', false),
  ('welcome', 'bn', 'স্বাগতম। নিরাপদে দ্রুত ঝুঁকি রিপোর্ট করুন।', false),
  ('photo_required', 'en', 'Photo is required. Take the photo from a safe position.', true),
  ('photo_required', 'ms', 'Gambar wajib dimuat naik. Ambil gambar dari tempat yang selamat.', false),
  ('ai_review', 'en', 'Review the AI hazard summary before submitting.', true),
  ('ai_review', 'ms', 'Semak ringkasan hazard AI sebelum hantar.', false)
on conflict (message_key, language_code) do nothing;

insert into public.reporters (whatsapp_id, phone_number, name, category, employee_id, preferred_language, consent_accepted, consent_accepted_at) values
  ('wa_60111111111', '60111111111', 'Demo Employee', 'employee', 'EMP001', 'en', true, now()),
  ('wa_60122222222', '60122222222', 'Demo Visitor', 'visitor', null, 'ms', true, now())
on conflict (phone_number) do nothing;

-- =========================
-- RLS baseline
-- =========================

alter table public.departments enable row level security;
alter table public.locations enable row level security;
alter table public.hazard_categories enable row level security;
alter table public.users enable row level security;
alter table public.ehs_users enable row level security;
alter table public.action_owners enable row level security;
alter table public.area_owner_mappings enable row level security;
alter table public.escalation_rules enable row level security;
alter table public.reporters enable row level security;
alter table public.language_preferences enable row level security;
alter table public.language_messages enable row level security;
alter table public.hazard_reports enable row level security;
alter table public.hazard_photos enable row level security;
alter table public.report_assignments enable row level security;
alter table public.action_updates enable row level security;
alter table public.status_history enable row level security;
alter table public.notifications enable row level security;

-- Phase 1 permissive read policies for authenticated internal users. Tighten before production.
drop policy if exists "Authenticated can read master data" on public.departments;
create policy "Authenticated can read master data" on public.departments for select to authenticated using (true);
drop policy if exists "Authenticated can read locations" on public.locations;
create policy "Authenticated can read locations" on public.locations for select to authenticated using (true);
drop policy if exists "Authenticated can read categories" on public.hazard_categories;
create policy "Authenticated can read categories" on public.hazard_categories for select to authenticated using (true);
drop policy if exists "Authenticated can read escalation" on public.escalation_rules;
create policy "Authenticated can read escalation" on public.escalation_rules for select to authenticated using (true);

-- EHS role can read reporters. Action owner should use action_owner_report_detail view instead.
drop policy if exists "Authenticated can read reporters in Phase 1" on public.reporters;
create policy "Authenticated can read reporters in Phase 1" on public.reporters for select to authenticated using (true);

-- Service role / route handlers should be used for public reporter submission in Phase 2.
-- Do not expose reporter phone numbers directly to action owner UI.
