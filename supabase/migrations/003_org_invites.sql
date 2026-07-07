-- ============================================================================
-- Phase 5 — Team invites (Sales Team "Invite Member" flow).
--
-- Invites are created by an Owner/Admin (via app/api/org/invite using the
-- regular server client — RLS-protected) and accepted server-side by
-- app/auth/callback using the service-role admin client (which bypasses RLS,
-- so no additional insert policy on org_users is required for acceptance).
-- ============================================================================

create table org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  name text,
  role org_role not null default 'Sales Executive',
  invited_by uuid references org_users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table org_invites enable row level security;

create policy "owners/admins can view invites for their org"
  on org_invites for select
  using (
    org_id in (
      select org_id from org_users
      where user_id = auth.uid() and role in ('Owner', 'Admin')
    )
  );

create policy "owners/admins can create invites for their org"
  on org_invites for insert
  with check (
    org_id in (
      select org_id from org_users
      where user_id = auth.uid() and role in ('Owner', 'Admin')
    )
  );

create policy "owners/admins can delete invites for their org"
  on org_invites for delete
  using (
    org_id in (
      select org_id from org_users
      where user_id = auth.uid() and role in ('Owner', 'Admin')
    )
  );
