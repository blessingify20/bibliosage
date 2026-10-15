-- ============================================================================
-- Bibliosage — optional extras
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste this whole file → Run.
--   Safe to run again ("if not exists"); nothing is dropped or rewritten.
--
-- Adds:
--   profiles.more   jsonb — the optional extra profile answers (life extras).
--   sessions.notes  jsonb — the tutor's compact "teaching notes" (its memory
--                           of what the reader knows, asked, ignored, etc.).
--   sessions.books  jsonb — "Books to explore" for topic sessions.
--
-- Row Level Security is UNCHANGED. The existing policies already cover every
-- column on these tables (policies apply to rows, not individual columns), and
-- the app already has select/insert/update grants for these two tables. So
-- there is no new policy and no new grant to add.
-- ============================================================================

alter table public.profiles
  add column if not exists more jsonb;

alter table public.sessions
  add column if not exists notes jsonb;

alter table public.sessions
  add column if not exists books jsonb;
