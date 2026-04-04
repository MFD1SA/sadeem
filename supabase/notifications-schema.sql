-- Senda Notifications — Run in Supabase SQL Editor

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text not null,
  entity_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select" on public.notifications for select
  using (organization_id in (
    select organization_id from public.memberships
    where user_id = auth.uid() and status = 'active'
  ));

create policy "notifications_insert" on public.notifications for insert
  with check (true);

create policy "notifications_update" on public.notifications for update
  using (organization_id in (
    select organization_id from public.memberships
    where user_id = auth.uid() and status = 'active'
  ));

create index idx_notifications_org on public.notifications(organization_id);
create index idx_notifications_unread on public.notifications(organization_id, is_read) where is_read = false;
