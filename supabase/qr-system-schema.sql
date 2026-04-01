-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Sadeem QR Review System — Schema
-- Run in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. QR Configurations (one per branch)
create table if not exists public.qr_configs (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mode text not null default 'landing' check (mode in ('direct', 'landing')),
  google_review_url text,
  slug text not null unique,
  show_employee_field boolean not null default true,
  custom_message text,
  scan_count integer not null default 0,
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.qr_configs enable row level security;

create policy "qr_configs_select" on public.qr_configs for select
  using (organization_id in (
    select organization_id from public.memberships
    where user_id = auth.uid() and status = 'active'
  ));

create policy "qr_configs_insert" on public.qr_configs for insert
  with check (organization_id in (
    select organization_id from public.memberships
    where user_id = auth.uid() and status = 'active'
  ));

create policy "qr_configs_update" on public.qr_configs for update
  using (organization_id in (
    select organization_id from public.memberships
    where user_id = auth.uid() and status = 'active'
  ));

create policy "qr_configs_delete" on public.qr_configs for delete
  using (organization_id in (
    select organization_id from public.memberships
    where user_id = auth.uid() and status = 'active'
  ));

create index idx_qr_configs_branch on public.qr_configs(branch_id);
create index idx_qr_configs_org on public.qr_configs(organization_id);
create index idx_qr_configs_slug on public.qr_configs(slug);

-- 2. QR Scan Analytics
create table if not exists public.qr_scans (
  id uuid primary key default uuid_generate_v4(),
  qr_config_id uuid not null references public.qr_configs(id) on delete cascade,
  event_type text not null default 'scan' check (event_type in ('scan', 'click', 'employee_submit')),
  employee_name text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.qr_scans enable row level security;

-- Scans can be inserted by anyone (public landing page)
create policy "qr_scans_insert_public" on public.qr_scans for insert
  with check (true);

-- Only org members can read scan data
create policy "qr_scans_select" on public.qr_scans for select
  using (qr_config_id in (
    select id from public.qr_configs
    where organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  ));

create index idx_qr_scans_config on public.qr_scans(qr_config_id);
create index idx_qr_scans_created on public.qr_scans(created_at);
