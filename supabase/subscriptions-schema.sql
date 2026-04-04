-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Senda Subscription System — Schema
-- Run in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan text not null default 'starter' check (plan in ('starter', 'growth', 'pro', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'trial', 'expired', 'cancelled')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select" on public.subscriptions for select
  using (organization_id in (
    select organization_id from public.memberships
    where user_id = auth.uid() and status = 'active'
  ));

create policy "subscriptions_insert" on public.subscriptions for insert
  with check (organization_id in (
    select organization_id from public.memberships
    where user_id = auth.uid() and status = 'active' and role = 'owner'
  ));

create policy "subscriptions_update" on public.subscriptions for update
  using (organization_id in (
    select organization_id from public.memberships
    where user_id = auth.uid() and status = 'active' and role = 'owner'
  ));

create index idx_subscriptions_org on public.subscriptions(organization_id);

-- Auto-create a starter trial subscription when an organization is created
create or replace function public.handle_new_organization_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (organization_id, plan, status, starts_at, ends_at)
  values (
    NEW.id,
    'starter',
    'trial',
    now(),
    now() + interval '14 days'
  );
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_organization_created_subscription
  after insert on public.organizations
  for each row
  execute function public.handle_new_organization_subscription();
