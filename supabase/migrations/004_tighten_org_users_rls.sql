-- ============================================================================
-- Phase 6 — Security hardening: tighten the org_users self-insert policy.
--
-- 002_self_serve_onboarding.sql added `user_id = auth.uid()` as the only check
-- on org_users inserts, so any authenticated user could add themselves to ANY
-- organization with ANY role (e.g. "Owner") just by knowing its org_id. This
-- replaces it with a policy that only allows the exact case the app actually
-- uses client-side: bootstrapping — becoming the first (Owner) member of a
-- brand-new organization you just created, which has zero members so far.
--
-- Team invites (app/api/org/invite + app/auth/callback) no longer rely on this
-- policy at all — they're accepted server-side with the service-role admin
-- client, which bypasses RLS entirely, so tightening this here doesn't break
-- that flow.
-- ============================================================================

drop policy if exists "a user can add themselves to org_users" on org_users;

create policy "a user can bootstrap the first membership of a new org"
  on org_users for insert
  with check (
    user_id = auth.uid()
    and role = 'Owner'
    and not exists (select 1 from org_users existing where existing.org_id = org_users.org_id)
  );
