-- ============================================================================
-- Aiventra AI CRM — Phase 1 + 2 schema
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.
-- Mirrors the TypeScript model in lib/types.ts so the app's mock-data reads can
-- be swapped for real Supabase queries one table at a time.
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type org_role as enum ('Owner', 'Admin', 'Sales Manager', 'Sales Executive', 'Site Engineer');
create type lead_stage as enum ('New', 'Contacted', 'Interested', 'Visit Scheduled', 'Negotiation', 'Won', 'Lost');
create type lead_source as enum ('Website', 'Referral', 'Walk-in', '99acres', 'MagicBricks', 'Instagram Ads', 'Broker');
create type unit_status as enum ('Available', 'Held', 'Booked', 'Sold');
create type customer_type as enum ('End User', 'Investor');
create type visit_status as enum ('Scheduled', 'Completed', 'Cancelled', 'No Show');
create type timeline_event_type as enum ('call', 'visit', 'whatsapp', 'document', 'payment', 'email');

-- ---------- Organizations ----------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  gstin text,
  rera_id text,
  city text,
  founded_year int,
  created_at timestamptz not null default now()
);

-- ---------- Org membership (links auth.users -> organizations with an RBAC role) ----------
create table org_users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role org_role not null default 'Sales Executive',
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

-- ---------- Projects ----------
create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  location text,
  total_units int not null default 0,
  towers int not null default 1,
  floors_per_tower int not null default 1,
  construction_progress int not null default 0,
  possession_date text,
  avg_ticket_size numeric,
  configurations text[] not null default '{}',
  rera_id text,
  created_at timestamptz not null default now()
);

-- ---------- Units ----------
create table units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  tower text not null,
  floor int not null,
  unit_no text not null,
  config text not null,
  area_sqft int not null,
  price numeric not null,
  status unit_status not null default 'Available',
  facing text,
  created_at timestamptz not null default now(),
  unique (project_id, unit_no)
);

-- ---------- Leads (with Phase 2 AI scoring inputs) ----------
create table leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  source lead_source,
  city text,
  budget_min numeric,
  budget_max numeric,
  interested_project_id uuid references projects(id),
  config_preference text,
  facing_preference text,
  stage lead_stage not null default 'New',
  assigned_to uuid references org_users(id),
  is_investor boolean not null default false,
  -- Phase 2: AI Hot Lead Scoring inputs
  response_speed_hrs numeric,       -- avg hours to respond
  avg_call_duration_min numeric,    -- avg call length
  visit_frequency int default 0,    -- number of site visits
  interest_score int default 0,     -- 0-100, engagement/sentiment signal
  -- Derived AI outputs (kept in sync by the scoring engine, see lib/ai/lead-scoring.ts)
  score int default 0,
  closing_probability int default 0,
  ai_suggestion text,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Customers ----------
create table customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  linked_lead_id uuid references leads(id),
  name text not null,
  phone text,
  email text,
  city text,
  type customer_type not null default 'End User',
  budget numeric,
  interested_config text,
  facing_preference text,
  ai_summary text,
  created_at timestamptz not null default now()
);

create table customer_timeline_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  type timeline_event_type not null,
  title text not null,
  description text,
  event_at timestamptz not null default now()
);

-- ---------- Site visits ----------
create table site_visits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  project_id uuid references projects(id),
  scheduled_at timestamptz not null,
  status visit_status not null default 'Scheduled',
  assigned_to uuid references org_users(id),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- Bookings / payments (Phase 3: Financial System) ----------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  unit_id uuid references units(id),
  customer_id uuid not null references customers(id),
  booked_by uuid references org_users(id),
  broker_name text,
  booking_amount numeric not null,
  token_amount numeric not null default 0,
  token_paid boolean not null default false,
  status text not null default 'Confirmed',
  -- Phase 3: AI Payment Default Risk inputs
  missed_milestones int not null default 0,
  payment_consistency int not null default 100, -- 0-100
  communication_responsiveness int not null default 100, -- 0-100
  booking_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table payment_milestones (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  label text not null,
  due_date timestamptz not null,
  amount numeric not null,
  status text not null default 'Pending', -- Paid | Pending | Overdue
  paid_date timestamptz,
  created_at timestamptz not null default now()
);

create table broker_commissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  booking_id uuid not null references bookings(id) on delete cascade,
  broker_name text not null,
  commission_pct numeric not null,
  commission_amount numeric not null,
  status text not null default 'Pending', -- Pending | Paid
  due_date timestamptz not null,
  created_at timestamptz not null default now()
);

-- ---------- Phase 4: Builder Operations ----------
create type construction_stage_status as enum ('Completed', 'In Progress', 'Upcoming', 'Delayed');
create type task_status as enum ('To Do', 'In Progress', 'Done');
create type task_priority as enum ('Low', 'Medium', 'High');
create type document_status as enum ('Verified', 'Pending', 'Rejected');
create type compliance_status as enum ('Compliant', 'Due Soon', 'Overdue');

create table construction_stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  stage text not null,
  planned_completion timestamptz,
  actual_completion timestamptz,
  progress int not null default 0,
  status construction_stage_status not null default 'Upcoming',
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id),
  title text not null,
  assigned_to uuid references org_users(id),
  due_date timestamptz,
  status task_status not null default 'To Do',
  priority task_priority not null default 'Medium',
  created_at timestamptz not null default now()
);

create table site_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id),
  engineer_id uuid references org_users(id),
  report_date timestamptz not null default now(),
  title text not null,
  summary text,
  progress_noted int,
  issues_flagged text[] default '{}',
  created_at timestamptz not null default now()
);

create table project_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id),
  name text not null,
  doc_type text,
  uploaded_at timestamptz not null default now(),
  status document_status not null default 'Pending',
  verified_by uuid references org_users(id),
  created_at timestamptz not null default now()
);

create table compliance_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id),
  requirement text not null,
  authority text,
  due_date timestamptz not null,
  status compliance_status not null default 'Compliant',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security — every table is scoped to the caller's organization(s)
-- via org_users. A user can only read/write rows in orgs they belong to.
-- ============================================================================

alter table organizations enable row level security;
alter table org_users enable row level security;
alter table projects enable row level security;
alter table units enable row level security;
alter table leads enable row level security;
alter table customers enable row level security;
alter table customer_timeline_events enable row level security;
alter table site_visits enable row level security;
alter table bookings enable row level security;
alter table payment_milestones enable row level security;
alter table broker_commissions enable row level security;
alter table construction_stages enable row level security;
alter table tasks enable row level security;
alter table site_reports enable row level security;
alter table project_documents enable row level security;
alter table compliance_items enable row level security;

-- Helper: orgs the current user belongs to
create or replace function auth_org_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select org_id from org_users where user_id = auth.uid();
$$;

create policy "org members can view their organization"
  on organizations for select
  using (id in (select auth_org_ids()));

create policy "org members can view org_users in their org"
  on org_users for select
  using (org_id in (select auth_org_ids()));

create policy "owners/admins can manage org_users in their org"
  on org_users for all
  using (
    org_id in (
      select org_id from org_users
      where user_id = auth.uid() and role in ('Owner', 'Admin')
    )
  );

create policy "org members can view projects" on projects for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage projects" on projects for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view units" on units for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage units" on units for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view leads" on leads for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage leads" on leads for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view customers" on customers for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage customers" on customers for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view timeline events" on customer_timeline_events for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage timeline events" on customer_timeline_events for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view site visits" on site_visits for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage site visits" on site_visits for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view bookings" on bookings for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage bookings" on bookings for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view payment milestones" on payment_milestones for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage payment milestones" on payment_milestones for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view broker commissions" on broker_commissions for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage broker commissions" on broker_commissions for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view construction stages" on construction_stages for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage construction stages" on construction_stages for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view tasks" on tasks for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage tasks" on tasks for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view site reports" on site_reports for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage site reports" on site_reports for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view project documents" on project_documents for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage project documents" on project_documents for all
  using (org_id in (select auth_org_ids()));

create policy "org members can view compliance items" on compliance_items for select
  using (org_id in (select auth_org_ids()));
create policy "org members can manage compliance items" on compliance_items for all
  using (org_id in (select auth_org_ids()));

-- ============================================================================
-- Seed: creates the Skyline Developers demo org. Run AFTER a user has signed
-- up, then insert a matching org_users row with that auth user's id, e.g.:
--
--   insert into org_users (org_id, user_id, name, email, role)
--   values ('<org id from below>', '<auth.users id>', 'Karan Mehta',
--            'karan@skylinedevelopers.in', 'Owner');
-- ============================================================================

insert into organizations (id, name, legal_name, gstin, rera_id, city, founded_year)
values (
  '11111111-1111-1111-1111-111111111111',
  'Skyline Developers',
  'Skyline Developers Pvt Ltd',
  '24AASCS1234K1Z8',
  'PR/GJ/AHMEDABAD/AH01/PART/2024/RA05678',
  'Ahmedabad, Gujarat',
  2011
);
