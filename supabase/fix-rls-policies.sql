-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Senda RLS Policy Fix
-- Run this in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ═══════════════════════════════════
-- 1. FIX BRANCHES TABLE
-- ═══════════════════════════════════

-- Drop the problematic "for all" policy (it lacks explicit WITH CHECK for INSERT)
drop policy if exists "Org members can manage branches" on public.branches;

-- Drop the read policy too (we'll recreate cleanly)
drop policy if exists "Org members can read branches" on public.branches;

-- SELECT: any active org member can read branches
create policy "branches_select"
  on public.branches for select
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

-- INSERT: active org members (owner or manager) can create branches
create policy "branches_insert"
  on public.branches for insert
  with check (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active' and role in ('owner', 'manager')
    )
  );

-- UPDATE: active org members (owner or manager) can update branches
create policy "branches_update"
  on public.branches for update
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active' and role in ('owner', 'manager')
    )
  );

-- DELETE: active org members (owner or manager) can delete branches
create policy "branches_delete"
  on public.branches for delete
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active' and role in ('owner', 'manager')
    )
  );


-- ═══════════════════════════════════
-- 2. FIX REPLY_TEMPLATES TABLE
-- ═══════════════════════════════════

-- Drop the problematic "for all" policy
drop policy if exists "Org members can manage templates" on public.reply_templates;

-- Drop the read policy too
drop policy if exists "Org members can read templates" on public.reply_templates;

-- SELECT: any active org member can read templates
create policy "templates_select"
  on public.reply_templates for select
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

-- INSERT: any active org member can create templates
create policy "templates_insert"
  on public.reply_templates for insert
  with check (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

-- UPDATE: any active org member can update templates
create policy "templates_update"
  on public.reply_templates for update
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

-- DELETE: any active org member can delete templates
create policy "templates_delete"
  on public.reply_templates for delete
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );


-- ═══════════════════════════════════
-- 3. FIX REPLY_DRAFTS TABLE (same pattern)
-- ═══════════════════════════════════

drop policy if exists "Org members can manage reply drafts" on public.reply_drafts;
drop policy if exists "Org members can read reply drafts" on public.reply_drafts;

create policy "drafts_select"
  on public.reply_drafts for select
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "drafts_insert"
  on public.reply_drafts for insert
  with check (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "drafts_update"
  on public.reply_drafts for update
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "drafts_delete"
  on public.reply_drafts for delete
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );


-- ═══════════════════════════════════
-- 4. FIX REVIEWS TABLE (same pattern)
-- ═══════════════════════════════════

drop policy if exists "System can insert reviews" on public.reviews;
drop policy if exists "Members can update reviews" on public.reviews;
drop policy if exists "Org members can read reviews" on public.reviews;

create policy "reviews_select"
  on public.reviews for select
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "reviews_insert"
  on public.reviews for insert
  with check (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "reviews_update"
  on public.reviews for update
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "reviews_delete"
  on public.reviews for delete
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );


-- ═══════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════
-- After running this, verify with:
--
-- select schemaname, tablename, policyname, cmd
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, cmd;
