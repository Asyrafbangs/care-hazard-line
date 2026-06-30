-- Phase 7: Gemini vision photo hazard analysis.
-- Stores the AI's structured assessment of the uploaded hazard photo
-- (analysed together with the reporter's description). The assessment is a
-- support tool only and never blocks submission. Run once in Supabase.

alter table public.hazard_reports
  add column if not exists ai_photo_analysis jsonb,
  add column if not exists ai_photo_hazard_count integer;
