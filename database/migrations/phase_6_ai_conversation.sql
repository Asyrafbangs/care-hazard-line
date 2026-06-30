-- Phase 6: Natural-conversation WhatsApp bot (Gemini).
-- Adds the 'ai_chat' session state used by the AI conversation engine.
-- Run once in the Supabase SQL Editor. Existing rows are unaffected.

alter table public.whatsapp_sessions
  drop constraint if exists whatsapp_sessions_state_check;

alter table public.whatsapp_sessions
  add constraint whatsapp_sessions_state_check check (
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
      'await_status_report',
      'ai_chat'
    )
  );
