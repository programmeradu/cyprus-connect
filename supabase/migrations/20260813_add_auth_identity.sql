-- Non-destructive Supabase Auth mapping. Existing Vuneli `user` IDs and every
-- foreign key to them remain unchanged.
create table if not exists public.auth_identity (
  supabase_user_id uuid primary key references auth.users(id) on delete cascade,
  vuneli_user_id text not null unique references public."user"(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_authenticated_at timestamptz not null default now()
);

alter table public.auth_identity enable row level security;
revoke all on table public.auth_identity from anon, authenticated;
