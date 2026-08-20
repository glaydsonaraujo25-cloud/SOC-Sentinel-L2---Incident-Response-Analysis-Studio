create table if not exists public.incidents (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'Novo',
  priority text not null,
  severity text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payload jsonb not null
);

create index if not exists incidents_user_id_idx on public.incidents(user_id);
create index if not exists incidents_updated_at_idx on public.incidents(updated_at desc);

alter table public.incidents enable row level security;

drop policy if exists "Users can view own incidents" on public.incidents;
create policy "Users can view own incidents"
on public.incidents for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own incidents" on public.incidents;
create policy "Users can create own incidents"
on public.incidents for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own incidents" on public.incidents;
create policy "Users can update own incidents"
on public.incidents for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own incidents" on public.incidents;
create policy "Users can delete own incidents"
on public.incidents for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.incidents to authenticated;
