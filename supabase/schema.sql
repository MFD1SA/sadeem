-- ============================================
-- سيندا (Senda) — Database Schema
-- Supabase PostgreSQL Migration
-- ============================================

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ─── 1. Users ───
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null unique,
  avatar_url text,
  role text not null default 'owner' check (role in ('owner', 'manager', 'staff', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- ─── 2. Organizations ───
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  industry text,
  country text default 'SA',
  city text,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

create policy "Org members can read their org"
  on public.organizations for select
  using (
    id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Owner can update org"
  on public.organizations for update
  using (owner_user_id = auth.uid());

create policy "Authenticated users can create org"
  on public.organizations for insert
  with check (auth.uid() = owner_user_id);

-- ─── 3. Memberships ───
create table public.memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'staff')),
  status text not null default 'active' check (status in ('active', 'inactive', 'invited')),
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

alter table public.memberships enable row level security;

create policy "Members can read own memberships"
  on public.memberships for select
  using (user_id = auth.uid());

create policy "Owners can manage memberships"
  on public.memberships for all
  using (
    organization_id in (
      select id from public.organizations where owner_user_id = auth.uid()
    )
  );

create policy "Authenticated users can create membership"
  on public.memberships for insert
  with check (user_id = auth.uid());

-- ─── 4. Branches ───
create table public.branches (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  google_location_id text,
  google_name text,
  internal_name text not null,
  city text,
  address text,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  created_at timestamptz not null default now()
);

alter table public.branches enable row level security;

create policy "Org members can read branches"
  on public.branches for select
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Org members can manage branches"
  on public.branches for all
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active' and role in ('owner', 'manager')
    )
  );

-- ─── 5. Reviews ───
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reviewer_name text not null default 'مجهول',
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text,
  source text not null default 'google' check (source in ('google', 'manual', 'import')),
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  status text not null default 'new' check (status in ('new', 'replied', 'pending_reply', 'auto_replied', 'flagged', 'ignored', 'manual_review_required')),
  google_review_id text,
  is_followup boolean not null default false,
  reviewer_google_id text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Org members can read reviews"
  on public.reviews for select
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "System can insert reviews"
  on public.reviews for insert
  with check (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Members can update reviews"
  on public.reviews for update
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

-- ─── 6. Reply Drafts ───
create table public.reply_drafts (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ai_reply text,
  edited_reply text,
  final_reply text,
  source text not null default 'ai' check (source in ('ai', 'template', 'manual')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'sent', 'auto_sent', 'rejected', 'deferred')),
  approved_by uuid references public.users(id),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.reply_drafts enable row level security;

create policy "Org members can read reply drafts"
  on public.reply_drafts for select
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Org members can manage reply drafts"
  on public.reply_drafts for all
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

-- ─── 7. Reply Templates ───
create table public.reply_templates (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  body text not null,
  category text not null default 'general' check (category in ('positive', 'negative', 'neutral', 'general')),
  rating_min integer default 1,
  rating_max integer default 5,
  is_active boolean not null default true,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.reply_templates enable row level security;

create policy "Org members can read templates"
  on public.reply_templates for select
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Org members can manage templates"
  on public.reply_templates for all
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

-- ─── Trigger: Auto-detect follow-up reviews ───
-- If a reviewer has already been replied to, mark new review as manual_review_required
create or replace function public.check_followup_review()
returns trigger as $$
begin
  -- Check if this reviewer already has a replied review on the same branch
  if exists (
    select 1 from public.reviews
    where branch_id = NEW.branch_id
      and reviewer_google_id = NEW.reviewer_google_id
      and reviewer_google_id is not null
      and status in ('replied', 'auto_replied')
      and id != NEW.id
  ) then
    NEW.is_followup := true;
    NEW.status := 'manual_review_required';
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trigger_check_followup
  before insert on public.reviews
  for each row
  execute function public.check_followup_review();

-- ─── Trigger: Auto-create user profile on auth signup ───
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, email, avatar_url)
  values (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─── Indexes ───
create index idx_memberships_user on public.memberships(user_id);
create index idx_memberships_org on public.memberships(organization_id);
create index idx_branches_org on public.branches(organization_id);
create index idx_reviews_branch on public.reviews(branch_id);
create index idx_reviews_org on public.reviews(organization_id);
create index idx_reviews_status on public.reviews(status);
create index idx_reviews_reviewer on public.reviews(reviewer_google_id);
create index idx_reply_drafts_review on public.reply_drafts(review_id);
create index idx_reply_templates_org on public.reply_templates(organization_id);
