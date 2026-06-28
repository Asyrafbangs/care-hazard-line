-- Phase 2B: Convert photo storage from Cloudinary to Supabase Storage.
-- Run this once in Supabase SQL Editor before testing the Phase 2B code.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hazard-photos',
  'hazard-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.hazard_photos
  add column if not exists storage_provider text not null default 'supabase',
  add column if not exists supabase_bucket text,
  add column if not exists supabase_storage_path text,
  add column if not exists original_file_name text,
  add column if not exists mime_type text,
  add column if not exists size_bytes integer;

alter table public.hazard_photos
  alter column cloudinary_public_id drop not null,
  alter column cloudinary_url drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'hazard_photos_storage_provider_check'
      and conrelid = 'public.hazard_photos'::regclass
  ) then
    alter table public.hazard_photos
      add constraint hazard_photos_storage_provider_check
      check (storage_provider in ('supabase', 'cloudinary', 'legacy'));
  end if;
end $$;

update public.hazard_photos
set storage_provider = 'supabase'
where storage_provider is null;
