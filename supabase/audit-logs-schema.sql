-- Sadeem Audit Log — Run in Supabase SQL Editor

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  event text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id text,
  entity_type text,
  details text,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select" on public.audit_logs for select
  using (organization_id in (
    select organization_id from public.memberships
    where user_id = auth.uid() and status = 'active'
  ));

create policy "audit_logs_insert" on public.audit_logs for insert
  with check (true);

create index idx_audit_logs_org on public.audit_logs(organization_id);
create index idx_audit_logs_event on public.audit_logs(event);
create index idx_audit_logs_created on public.audit_logs(created_at);
