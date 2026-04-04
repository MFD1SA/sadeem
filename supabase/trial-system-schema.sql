-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Senda Trial System — Schema Update
-- Run in Supabase SQL Editor AFTER subscriptions-schema.sql
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Add usage tracking columns
alter table public.subscriptions
  add column if not exists ai_replies_used integer not null default 0,
  add column if not exists template_replies_used integer not null default 0;

-- 2. Update the trial trigger to 24 hours instead of 14 days
create or replace function public.handle_new_organization_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (organization_id, plan, status, starts_at, ends_at, ai_replies_used, template_replies_used)
  values (
    NEW.id,
    'starter',
    'trial',
    now(),
    now() + interval '24 hours',
    0,
    0
  );
  return NEW;
end;
$$ language plpgsql security definer;

-- 3. Function to check and increment AI usage (called from client)
create or replace function public.increment_ai_reply(org_id uuid)
returns boolean as $$
declare
  sub record;
  max_ai integer;
begin
  select * into sub from public.subscriptions
    where organization_id = org_id
    order by created_at desc limit 1;

  if sub is null then return false; end if;

  -- Trial limits
  if sub.status = 'trial' then
    -- Check if trial expired
    if sub.ends_at is not null and sub.ends_at < now() then
      update public.subscriptions set status = 'expired', updated_at = now()
        where id = sub.id;
      return false;
    end if;
    max_ai := 2;
  elsif sub.status = 'expired' or sub.status = 'cancelled' then
    return false;
  else
    -- Active plans: no AI limit (or high limit)
    max_ai := 999999;
  end if;

  if sub.ai_replies_used >= max_ai then return false; end if;

  update public.subscriptions
    set ai_replies_used = ai_replies_used + 1, updated_at = now()
    where id = sub.id;

  return true;
end;
$$ language plpgsql security definer;

-- 4. Function to check and increment template usage
create or replace function public.increment_template_reply(org_id uuid)
returns boolean as $$
declare
  sub record;
  max_templates integer;
begin
  select * into sub from public.subscriptions
    where organization_id = org_id
    order by created_at desc limit 1;

  if sub is null then return false; end if;

  if sub.status = 'trial' then
    if sub.ends_at is not null and sub.ends_at < now() then
      update public.subscriptions set status = 'expired', updated_at = now()
        where id = sub.id;
      return false;
    end if;
    max_templates := 10;
  elsif sub.status = 'expired' or sub.status = 'cancelled' then
    return false;
  else
    max_templates := 999999;
  end if;

  if sub.template_replies_used >= max_templates then return false; end if;

  update public.subscriptions
    set template_replies_used = template_replies_used + 1, updated_at = now()
    where id = sub.id;

  return true;
end;
$$ language plpgsql security definer;
