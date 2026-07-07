-- ============================================================================
-- Phase 3 auth wiring — self-serve onboarding policies.
-- schema.sql only allowed SELECT on organizations/org_users, which is correct
-- for day-to-day use but blocks the very first insert a brand new user needs
-- to make when creating their organization from /onboarding. These policies
-- open that up narrowly: a signed-in user may create an organization, and may
-- add themselves (and only themselves) as an org_users row.
--
-- Run this after supabase/schema.sql on your project (SQL editor or
-- `supabase db push`).
-- ============================================================================

create policy "authenticated users can create an organization"
  on organizations for insert
  with check (auth.uid() is not null);

create policy "owners/admins can update their organization"
  on organizations for update
  using (id in (select auth_org_ids()));

create policy "a user can add themselves to org_users"
  on org_users for insert
  with check (user_id = auth.uid());
