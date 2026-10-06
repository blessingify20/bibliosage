-- ============================================================================
-- Bibliosage — database schema
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste this whole file → Run.
--   (The file is safe to run again if you ever need to re-run it.)
--
-- Tables:
--   profiles       — the three quick questions each user answers once
--   sessions       — one row per learning session (composer; the tutor later)
--   subscriptions  — plan (free/plus); a MISSING row means Free
--
-- Row Level Security is ON for all three tables. Users can only ever touch
-- their own rows — and subscriptions are READ-ONLY for users, so a plan can
-- only be changed later by trusted server-side code, never by the browser.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  life       text,
  goal       text,
  blocker    text,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  input_type    text not null check (input_type in ('paste', 'topic')),
  input_text    text,
  session_goal  text,
  conversation  jsonb,
  actions       jsonb,
  created_at    timestamptz not null default now()
);

-- the dashboard counts a user's sessions for the current month
create index if not exists sessions_user_created_idx
  on public.sessions (user_id, created_at desc);

create table if not exists public.subscriptions (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  plan       text not null default 'free' check (plan in ('free', 'plus')),
  updated_at timestamptz not null default now()
);

-- keep updated_at honest for the (future, server-side) plan changes
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.subscriptions enable row level security;

-- profiles: users may select, insert and update ONLY their own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sessions: users may select and insert ONLY their own rows
drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);

-- subscriptions: users may ONLY select their own row (no insert, no update —
-- a plan can only change via trusted server-side code later)
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Access for the app (the "authenticated" role is a signed-in user;
--    the anonymous "anon" role gets nothing)
-- ---------------------------------------------------------------------------

grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.sessions to authenticated;
grant select on public.subscriptions to authenticated;