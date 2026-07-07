-- ============================================================================
-- Optional demo data — Aiventra AI CRM
--
-- This is NOT run automatically and is entirely optional. The app itself
-- never seeds or reads mock data; every page reads live from Supabase. This
-- script just gives a brand-new organization some realistic sample data
-- (projects, units, leads, customers, bookings, tasks, etc.) so you can click
-- around before connecting your own real data.
--
-- HOW TO RUN:
--   1. Run supabase/schema.sql and every file in supabase/migrations/ first.
--   2. Sign up in the app and complete onboarding (Settings → your org page
--      will show your organization's id, or query:
--        select id, name from organizations;
--   3. In the Supabase SQL editor, set the org id below and run this file:
--        \set org_id 'YOUR-ORG-UUID-HERE'
--      (or replace every :'org_id' with your literal UUID before running).
-- ============================================================================

\set org_id 'YOUR-ORG-UUID-HERE'

-- ---------- Projects ----------
insert into projects (id, org_id, name, location, total_units, towers, floors_per_tower, construction_progress, possession_date, avg_ticket_size, configurations, rera_id)
values
  (gen_random_uuid(), :'org_id', 'Skyline Heights', 'Bopal, Ahmedabad', 96, 2, 12, 62, 'Dec 2026', 11500000, '{2BHK,3BHK}', 'PR/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/CAA03935'),
  (gen_random_uuid(), :'org_id', 'Skyline Greens', 'Shela, Ahmedabad', 60, 1, 15, 34, 'Jun 2027', 15800000, '{3BHK,4BHK}', 'PR/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/CAA04102')
on conflict do nothing;

-- ---------- Units (Skyline Heights: 2 towers x 12 floors x 4 units) ----------
do $$
declare
  proj record;
  t text;
  f int;
  u int;
  cfg text;
  towers text[] := array['A','B'];
  configs text[] := array['2BHK','3BHK'];
begin
  for proj in select id, avg_ticket_size from projects where org_id = :'org_id' and name = 'Skyline Heights' loop
    foreach t in array towers loop
      for f in 1..12 loop
        for u in 1..4 loop
          cfg := configs[1 + floor(random() * 2)::int];
          insert into units (project_id, org_id, tower, floor, unit_no, config, area_sqft, price, status, facing)
          values (
            proj.id, :'org_id', t, f, t || '-' || f || lpad(u::text, 2, '0'), cfg,
            case cfg when '2BHK' then 1150 else 1580 end,
            round((case cfg when '2BHK' then 1150 else 1580 end) * (proj.avg_ticket_size / 1580.0) / 100000) * 100000,
            (array['Available','Available','Available','Held','Booked','Sold'])[1 + floor(random() * 6)::int],
            (array['North','South','East','West','North-East','South-East'])[1 + floor(random() * 6)::int]
          );
        end loop;
      end loop;
    end loop;
  end loop;
end $$;

-- ---------- Leads ----------
insert into leads (org_id, name, phone, email, source, city, budget_min, budget_max, interested_project_id, config_preference, stage, response_speed_hrs, avg_call_duration_min, visit_frequency, interest_score, last_contacted_at)
select
  :'org_id', name, phone, email, source::lead_source, 'Ahmedabad', budget_min, budget_max,
  (select id from projects where org_id = :'org_id' order by random() limit 1),
  config, stage::lead_stage, resp, call_min, visits, interest, now() - (days || ' days')::interval
from (values
  ('Rahul Sharma', '+91 98240 11223', 'rahul.sharma@example.com', 'Website', 11000000, 13000000, '3BHK', 'Negotiation', 2, 9, 3, 88, 1),
  ('Farhan Sheikh', '+91 98250 22334', 'farhan.sheikh@example.com', 'Referral', 14000000, 16500000, '4BHK', 'Negotiation', 4, 7, 2, 76, 2),
  ('Priya Patel', '+91 98260 33445', 'priya.patel@example.com', 'Walk-in', 9500000, 11000000, '2BHK', 'Visit Scheduled', 6, 5, 1, 60, 4),
  ('Aman Verma', '+91 98270 44556', 'aman.verma@example.com', '99acres', 10500000, 12000000, '2BHK', 'Contacted', 18, 3, 0, 40, 6),
  ('Sneha Iyer', '+91 98280 55667', 'sneha.iyer@example.com', 'MagicBricks', 15000000, 17000000, '3BHK', 'New', 30, 2, 0, 25, 9),
  ('Vikram Rao', '+91 98290 66778', 'vikram.rao@example.com', 'Instagram Ads', 12000000, 14000000, '3BHK', 'Interested', 10, 6, 2, 68, 3)
) as t(name, phone, email, source, budget_min, budget_max, config, stage, resp, call_min, visits, interest, days);

-- ---------- Customers ----------
insert into customers (org_id, name, phone, email, city, type, budget, interested_config, facing_preference, ai_summary)
values
  (:'org_id', 'Karan Mehta', '+91 98211 10011', 'karan.mehta@example.com', 'Ahmedabad', 'End User', 12500000, '3BHK', 'East', 'End user from Ahmedabad, budget ₹1.25Cr, interested in 3BHK, prefers east-facing.'),
  (:'org_id', 'Divya Nair', '+91 98222 20022', 'divya.nair@example.com', 'Ahmedabad', 'Investor', 16000000, '4BHK', 'North', 'Investor from Ahmedabad, budget ₹1.6Cr, interested in 4BHK, prefers north-facing.'),
  (:'org_id', 'Rohan Gupta', '+91 98233 30033', 'rohan.gupta@example.com', 'Ahmedabad', 'End User', 9800000, '2BHK', 'South', 'End user from Ahmedabad, budget ₹98L, interested in 2BHK, prefers south-facing.')
on conflict do nothing;

insert into customer_timeline_events (customer_id, org_id, type, title, description, event_at)
select c.id, :'org_id', 'call'::timeline_event_type, 'Discussed floor plans', 'Walked through 3BHK layouts and pricing.', now() - interval '5 days'
from customers c where c.org_id = :'org_id' and c.name = 'Karan Mehta';

insert into customer_timeline_events (customer_id, org_id, type, title, description, event_at)
select c.id, :'org_id', 'visit'::timeline_event_type, 'Site visit completed', 'Visited Skyline Heights show flat.', now() - interval '2 days'
from customers c where c.org_id = :'org_id' and c.name = 'Karan Mehta';

-- ---------- Site visits ----------
insert into site_visits (org_id, lead_id, project_id, scheduled_at, status, notes)
select :'org_id', l.id, l.interested_project_id, now() + interval '2 days', 'Scheduled', 'Prefers a weekend slot.'
from leads l where l.org_id = :'org_id' and l.name = 'Priya Patel';

-- ---------- Bookings + milestones (Karan Mehta books an available unit) ----------
do $$
declare
  v_unit_id uuid;
  v_customer_id uuid;
  v_booking_id uuid;
  v_amount numeric;
begin
  select id, price into v_unit_id, v_amount from units where org_id = :'org_id' and status = 'Available' limit 1;
  select id into v_customer_id from customers where org_id = :'org_id' and name = 'Karan Mehta';

  if v_unit_id is not null and v_customer_id is not null then
    insert into bookings (id, org_id, unit_id, customer_id, booking_amount, token_amount, token_paid, status, payment_consistency, communication_responsiveness, booking_date)
    values (gen_random_uuid(), :'org_id', v_unit_id, v_customer_id, v_amount, round(v_amount * 0.02), true, 'Confirmed', 92, 88, now() - interval '30 days')
    returning id into v_booking_id;

    update units set status = 'Booked' where id = v_unit_id;

    insert into payment_milestones (booking_id, org_id, label, due_date, amount, status, paid_date) values
      (v_booking_id, :'org_id', 'Token amount', now() - interval '30 days', round(v_amount * 0.02), 'Paid', now() - interval '30 days'),
      (v_booking_id, :'org_id', 'On agreement', now() - interval '9 days', round(v_amount * 0.18), 'Paid', now() - interval '9 days'),
      (v_booking_id, :'org_id', 'On slab completion', now() + interval '120 days', round(v_amount * 0.40), 'Pending', null),
      (v_booking_id, :'org_id', 'On possession', now() + interval '570 days', round(v_amount * 0.40), 'Pending', null);

    insert into broker_commissions (org_id, booking_id, broker_name, commission_pct, commission_amount, status, due_date)
    values (:'org_id', v_booking_id, 'Patel Realty Partners', 2, round(v_amount * 0.02), 'Pending', now() + interval '15 days');
  end if;
end $$;

-- ---------- Construction stages ----------
insert into construction_stages (org_id, project_id, stage, planned_completion, actual_completion, progress, status)
select :'org_id', p.id, stage, planned::timestamptz, actual::timestamptz, progress, status::construction_stage_status
from projects p, (values
  ('Excavation', now() - interval '300 days', now() - interval '290 days', 100, 'Completed'),
  ('Foundation', now() - interval '250 days', now() - interval '235 days', 100, 'Completed'),
  ('Superstructure', now() - interval '120 days', null, 65, 'In Progress'),
  ('Brickwork', now() + interval '30 days', null, 10, 'Upcoming'),
  ('Finishing', now() + interval '150 days', null, 0, 'Upcoming'),
  ('Handover', now() + interval '300 days', null, 0, 'Upcoming')
) as s(stage, planned, actual, progress, status)
where p.org_id = :'org_id' and p.name = 'Skyline Heights';

-- ---------- Tasks ----------
insert into tasks (org_id, title, project_id, due_date, status, priority)
select :'org_id', title, (select id from projects where org_id = :'org_id' and name = 'Skyline Heights'), due::timestamptz, status::task_status, priority::task_priority
from (values
  ('Inspect plastering — Tower A, floor 6', now() + interval '3 days', 'To Do', 'High'),
  ('Verify fire-safety NOC draft', now() + interval '5 days', 'In Progress', 'Medium'),
  ('Site walkthrough with structural consultant', now() - interval '1 days', 'Done', 'High')
) as t(title, due, status, priority);

-- ---------- Site reports ----------
insert into site_reports (org_id, project_id, report_date, title, summary, progress_noted, issues_flagged)
select :'org_id', p.id, now() - interval '2 days', 'Weekly progress — Superstructure', 'Slab work on floor 7 completed on schedule. Minor delay in rebar delivery for floor 8.', 65, array['Rebar delivery delayed by 3 days']
from projects p where p.org_id = :'org_id' and p.name = 'Skyline Heights';

-- ---------- Documents ----------
insert into project_documents (org_id, name, project_id, doc_type, status)
select :'org_id', 'RERA Registration Certificate', p.id, 'RERA Certificate', 'Verified'
from projects p where p.org_id = :'org_id' and p.name = 'Skyline Heights';

insert into project_documents (org_id, name, project_id, doc_type, status)
select :'org_id', 'Fire Safety NOC — Draft', p.id, 'NOC', 'Pending'
from projects p where p.org_id = :'org_id' and p.name = 'Skyline Heights';

-- ---------- Compliance items ----------
insert into compliance_items (org_id, project_id, requirement, authority, due_date, status)
select :'org_id', p.id, req, authority, due::timestamptz, status::compliance_status
from projects p, (values
  ('RERA quarterly progress filing', 'Gujarat RERA', now() + interval '10 days', 'Due Soon'),
  ('Environmental clearance renewal', 'GPCB', now() - interval '5 days', 'Overdue'),
  ('Fire NOC renewal', 'Fire Department', now() + interval '60 days', 'Compliant')
) as c(req, authority, due, status)
where p.org_id = :'org_id' and p.name = 'Skyline Heights';
