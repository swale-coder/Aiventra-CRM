# Aiventra AI CRM — Phase 1 (Core Foundation)

Premium AI-powered CRM for real estate builders. This is the Phase 1 deliverable: a fully
navigable, production-styled frontend covering the Phase 1 module list, running on demo data
for **Skyline Developers Pvt Ltd**.

# Aiventra AI CRM — Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 5

Premium AI-powered CRM for real estate builders. This build combines:

- **Phase 1 — Core Foundation**: auth, org onboarding, builder profile, projects, unit inventory,
  lead pipeline, customer profiles, site visit scheduler, sales team management
- **Phase 2 — Sales Intelligence Layer**: AI Hot Lead Scoring, Smart Follow-up Engine, AI Sales
  Recommendations, Customer Summary Generator
- **Phase 3 — Financial System**: booking management, payment milestones, token amounts, pending
  dues, auto reminders, AI revenue forecasting, broker commissions, AI payment default risk
- **Phase 4 — Builder Operations**: construction progress tracking, team tasks, site engineer
  reports, document verification, legal compliance tracker
- **Phase 5 — AI Assistant Layer**: Aiventra Copilot, a full natural-language query layer grounded
  across every module above

Demo data is for **Skyline Developers Pvt Ltd**.

## What's new in this delivery: real Supabase auth

Phase 1 shipped as a frontend-only demo. This build wires up **real Supabase authentication**:

- Email/password sign-in and sign-up (`app/page.tsx`, `app/signup/page.tsx`)
- Google SSO button (`signInWithOAuth`) with an OAuth callback route (`app/auth/callback/route.ts`)
- Session refresh + route protection middleware (`middleware.ts`, `lib/supabase/middleware.ts`)
- Browser + server Supabase clients (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- A full Postgres schema with **Row Level Security** scoped by organization (`supabase/schema.sql`)
- Sign-out from the avatar menu in the top header

**It runs with zero setup.** Until you add Supabase credentials to `.env.local`, the app detects
that (`lib/supabase/config.ts`) and stays in demo mode: the login/signup forms skip real auth and
go straight into the app, and every page reads from `lib/mock-data.ts`. Nothing crashes either
way — add credentials whenever you're ready to go live.

## Auth system (this delivery)

The UI, colors, and layouts are untouched. This delivery wires the **existing** UI up to real
Supabase authentication, organizations, and role-based access — no mock data is used for
identity/session anymore once you connect a project.

**Implemented:**

1. **Login** — `app/page.tsx`, email/password via `supabase.auth.signInWithPassword`
2. **Logout** — avatar menu in the top header (`components/shared/top-header.tsx`), calls
   `supabase.auth.signOut()` through `useAuth().signOut()`
3. **Session persistence** — Supabase's SSR cookie-based session, refreshed on every request by
   the middleware; `AuthProvider` also listens for `onAuthStateChange` on the client
4. **Route protection** — `lib/supabase/middleware.ts` redirects unauthenticated users to `/`
   (preserving the original destination as `?redirectTo=`), and redirects already-signed-in users
   away from `/` and `/signup`
5. **Middleware** — `middleware.ts` → `lib/supabase/middleware.ts`, runs on every non-static route
6. **Organization-based access** — every authenticated user is resolved to an `org_users` row
   (`org_id` + `role`); users with no organization yet are redirected to `/onboarding`, which now
   really creates the organization and membership row (see below) instead of just being a
   click-through demo
7. **User roles** — `Owner`, `Admin`, `Sales Manager`, `Sales Executive`, `Site Engineer`. Both the
   sidebar/mobile nav (`lib/nav.ts`) and the middleware (`ROLE_ROUTE_ACCESS` in
   `lib/supabase/middleware.ts`) hide/block modules a role shouldn't see — e.g. a Site Engineer
   only gets Dashboard, Operations, Projects; a Sales Executive doesn't see Finance or Sales Team

**New/changed files:**

- `lib/auth/session.ts` — server-only helpers: `getServerUser`, `getAppSession`,
  `requireAppSession`, `requireRole`, `hasRole`. Use these in Server Components/Actions to read
  the signed-in user + their org-scoped role; every future data query should filter by
  `session.orgUser.orgId`
- `lib/auth/AuthProvider.tsx` — client context (`useAuth()`) exposing `user`, `orgUser`,
  `organization`, `role`, `signOut()`. Wrapped around the whole app in `app/layout.tsx`
- `lib/auth/actions.ts` — `completeOnboarding()`, creates the organization + the caller's
  `org_users` row as `Owner`
- `supabase/migrations/002_self_serve_onboarding.sql` — **run this after `schema.sql`**. It adds
  the INSERT policies that let a brand-new signed-in user create their organization and their own
  membership row (schema.sql only had SELECT policies, which is correct for daily use but blocks
  the very first insert onboarding needs)
- `lib/supabase/middleware.ts` — now also does org-membership + role-route enforcement, not just
  the auth check
- `lib/nav.ts` — added `ROLE_NAV_ACCESS` / `getNavItemsForRole()`
- `components/shared/top-header.tsx`, `icon-rail.tsx`, `mobile-dock.tsx`, `app/dashboard/page.tsx`
  — now read the signed-in user/org from `useAuth()` instead of the hardcoded first mock user

**Scope note:** business data (leads, customers, projects, bookings, etc.) still reads from
`lib/mock-data.ts` for now — `lib/types.ts` already mirrors `supabase/schema.sql` column-for-column,
so wiring each module to real queries scoped by `session.orgUser.orgId` is a mechanical follow-up
whenever you're ready for it.

### Connecting your own Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API
3. In the SQL editor, run `supabase/schema.sql`, then run
   `supabase/migrations/002_self_serve_onboarding.sql`
4. Restart the dev server. Go to `/signup`, create an account, confirm the email Supabase sends
5. Log in — since you have no organization yet, you'll land on `/onboarding`. Fill in the
   organization step and click through to "Go to dashboard" — this creates the organization and
   adds you as `Owner`, then takes you to `/dashboard`
6. To try other roles, have the Owner invite teammates (Supabase Dashboard → Authentication → add
   user, or your own invite flow), then insert an `org_users` row for them with the desired
   `role` and the same `org_id`

## What's new in this delivery: Phase 5 — AI Assistant Layer

A new full-page **`/assistant`** (linked from the nav rail as "AI Assistant", and reachable from
the floating orb via the expand icon) — this is the "Aiventra Copilot" capability described as
the product's USP, now answering across **every module built in Phases 1–4**, not just dashboard
KPIs:

- "Show hot leads for Skyline Heights" — filters and ranks leads for that project by AI score
- "Who is likely to close this week?" — negotiation/visit-scheduled leads ranked by closing %
- "Revenue forecast for next quarter" — pulls from the Phase 3 forecasting engine
- "Pending payments above 10 lakh" — parses the amount and threshold-filters real booking
  milestones
- Plus: payment default risk, construction status per project, compliance items, open tasks,
  broker commissions, upcoming site visits, going-cold leads, and the sales leaderboard

Two things make this Copilot different from a generic chatbot wrapper:

1. **`lib/ai/copilot-engine.ts`** is a real intent router — it parses the question (project names,
   amount thresholds like "10 lakh"/"2 crore", time windows like "this week"/"next quarter") and
   answers from live data structures, returning both a text answer and a structured table where
   relevant. This runs with zero external calls, so the Assistant fully works without any API key.
2. When `OPENAI_API_KEY` **is** configured, `app/api/ai/copilot/route.ts` hands the engine's
   already-computed grounded answer plus a full cross-module business snapshot to the model as
   context, so the live LLM phrasing can't drift from what's actually in the CRM.

The floating orb (every page) still gives quick access to the same engine; `/assistant` is the
full-canvas version with suggested-prompt chips and inline data tables rendered under each answer.

## What's new in this delivery: Phase 4 — Builder Operations

One new page: **`/operations`** (linked from the nav rail), organized into five tabs:

- **Construction** — every project's stage-by-stage timeline (excavation → foundation → structure
  → brickwork → plastering → finishing/handover) with per-stage progress bars and a delayed-stage
  flag, plus each project's overall construction % pulled from the same data used on `/projects`
- **Team Tasks** — a three-column board (To Do / In Progress / Done) with priority badges,
  assignee avatars, and due dates; tap a card to advance it to the next status
- **Site Reports** — site engineer submissions per project with a progress note and any flagged
  issues (e.g. contractor delays, quality concerns)
- **Documents** — document verification queue (RERA certificates, NOCs, approvals, legal) with
  Verify/Reject actions on pending items
- **Compliance** — a legal compliance tracker across all projects and authorities (RERA, Fire
  Dept, Municipal Corp, Pollution Control, Labour Dept), sorted overdue-first

The Supabase schema (`supabase/schema.sql`) now includes `construction_stages`, `tasks`,
`site_reports`, `project_documents`, and `compliance_items` tables with RLS policies.

## What's new in this delivery: Phase 3 — Financial System

Two new pages: **`/bookings`** and **`/finance`** (both linked from the nav rail).

- **Booking management** (`/bookings`) — every booking with unit, customer, broker, and a
  collected-vs-total progress bar; expand any booking to see its full payment milestone schedule
  and an AI payment-risk breakdown
- **Payment milestones & token amount** — each booking carries a milestone plan (token → agreement
  → slab completion → possession) with per-milestone Paid/Pending/Overdue status
- **Pending dues** (`/finance`) — aggregate KPI split into pending vs overdue, computed live from
  every booking's unpaid milestones (`pendingDuesSummary` in `lib/ai/payment-risk.ts`)
- **Auto reminders** (`/finance`) — every unpaid milestone surfaced and ranked (overdue first,
  then soonest-due), each with a **Send reminder** button that drafts a message
- **AI revenue forecast** (`/finance`) — next 7 days / next month / next quarter, blending
  confirmed booking milestones due in that window with pipeline value (negotiation-stage leads ×
  their AI closing probability) — see `lib/ai/revenue-forecast.ts`
- **Broker commissions** (`/finance`) — a ledger of who's owed what, at what %, with due dates and
  paid/pending status
- **AI payment default risk prediction** (`lib/ai/payment-risk.ts`, shown per booking on
  `/bookings`) — a transparent weighted model combining overdue duration, missed-milestone count,
  historical payment consistency, and communication responsiveness into a Low/Medium/High risk
  tier with a full factor breakdown, same pattern as the Phase 2 lead-scoring engine

The `/api/ai/payment-reminder` route follows the same live-OpenAI-with-deterministic-fallback
pattern as the Phase 2 routes.

The Supabase schema (`supabase/schema.sql`) now includes `bookings`, `payment_milestones`, and
`broker_commissions` tables with RLS policies, matching `lib/types.ts`.

## What's new in this delivery: Phase 2 AI features

All live at **`/ai-insights`** (also linked from the nav rail), plus surfaced throughout the
Lead OS and dashboard:

- **AI Hot Lead Scoring** (`lib/ai/lead-scoring.ts`) — a transparent, weighted model combining
  response speed, average call duration, budget match, visit frequency, and an interest/sentiment
  signal into a 0–100 score and a closing probability. Every lead's score badge across the app
  (Kanban cards, dashboard, leaderboard) is computed by this engine, not hardcoded — pick any lead
  on the AI Insights page to see the full factor breakdown.
- **Smart Follow-up Engine** (`getFollowUpAlerts` in the same file) — flags any active lead not
  contacted in 3+ days, ranked by score, with urgency levels ("high-intent lead going cold" vs a
  plain reminder). Each alert has a **Draft follow-up message** button.
- **AI Sales Recommendations** (`lib/ai/recommend-unit.ts`) — ranks available units against a
  lead's budget, configuration, and facing preference with human-readable match reasons (e.g.
  "Suggest unit B-1402 — within budget, matches 3BHK preference, East-facing as preferred").
- **Customer Summary Generator** (`generateCustomerSummary`) — produces the one-line AI summary
  style ("Investor from Ahmedabad, budget 1.2Cr, interested in 3BHK, prefers east-facing.") from
  structured customer data.

### Live OpenAI wiring (optional)

Three API routes back the AI features with a real OpenAI call when you add `OPENAI_API_KEY` to
`.env.local`, and fall back to the deterministic engines above when the key is absent — so Phase 2
works fully offline out of the box, and gets a live-generation upgrade when you're ready:

- `app/api/ai/copilot/route.ts` — powers the floating Aiventra Copilot orb, grounded in the app's
  real KPIs/leads/projects so it won't invent numbers
- `app/api/ai/follow-up/route.ts` — drafts the follow-up messages on `/ai-insights`
- `app/api/ai/customer-summary/route.ts` — the "Regenerate" button on the summary generator

## Stack

- Next.js 15 (App Router) + TypeScript
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`) for auth + Postgres + RLS
- TailwindCSS with a custom Aiventra design-token theme (orange/black/white, glassmorphism)
- Framer Motion for animation, Recharts for charts, Lucide for icons
- Radix UI primitives (dialog for the command palette)
- OpenAI Chat Completions API (optional, server-side only)

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without any `.env.local`, everything runs in demo mode — sign in goes
straight to the dashboard, and all AI features use their built-in deterministic engines.

## Project structure

```
app/
  page.tsx                     Login (Supabase auth, demo-mode fallback)
  signup/page.tsx               Sign up
  auth/callback/route.ts        OAuth/magic-link callback
  onboarding/page.tsx           Org onboarding + builder profile wizard
  dashboard/page.tsx            AI Home Dashboard
  assistant/page.tsx             Phase 5 — full-page Aiventra Copilot
  leads/page.tsx                 Lead OS (Kanban) — scores from the real engine
  ai-insights/page.tsx           Phase 2 — Sales Intelligence Layer
  projects/page.tsx              Project Intelligence
  operations/page.tsx            Phase 4 — Construction, tasks, site reports, docs, compliance
  bookings/page.tsx              Phase 3 — Booking management + payment milestones + risk
  finance/page.tsx                Phase 3 — Revenue forecast, dues, reminders, commissions
  customers/page.tsx             Customer 360
  site-visits/page.tsx           Site visit scheduler
  sales-team/page.tsx            Sales team management
  api/ai/
    copilot/route.ts             Phase 5 — Copilot chat, engine-grounded (OpenAI + fallback)
    follow-up/route.ts           Follow-up message drafting (OpenAI + fallback)
    customer-summary/route.ts    Customer summary generation (OpenAI + fallback)
    payment-reminder/route.ts     Payment reminder drafting (OpenAI + fallback)
components/
  shared/                       App shell, nav, command palette, AI orb, header (with sign-out)
  dashboard/                     Dashboard widgets, charts, project cards, unit heatmap
  leads/                         Kanban lead card
  operations/                    Construction, tasks, site reports, documents, compliance tabs
  ui/                            Button, Card, Badge, Avatar, Progress, Tabs primitives
lib/
  types.ts                      Domain model — mirrors supabase/schema.sql column-for-column
  mock-data.ts                   Demo data for Skyline Developers, scored via lib/ai engines
  ai/
    lead-scoring.ts              AI Hot Lead Scoring + Smart Follow-up Engine (Phase 2)
    recommend-unit.ts            AI Sales Recommendations + Customer Summary Generator (Phase 2)
    payment-risk.ts              AI Payment Default Risk + pending dues + auto reminders (Phase 3)
    revenue-forecast.ts          AI Revenue Forecast (Phase 3)
    copilot-engine.ts            Phase 5 — cross-module NL query engine + OpenAI grounding context
  supabase/
    client.ts / server.ts        Browser/server Supabase clients (null in demo mode)
    middleware.ts / config.ts    Session refresh, route protection, config detection
  utils.ts                       Formatting helpers
supabase/
  schema.sql                    Full Postgres schema + RLS policies + seed org (Phases 1-4 tables)
middleware.ts                   Root middleware wiring session refresh
.env.example                    Supabase + OpenAI env var template
```

## Where this leaves the original roadmap

All five phases of the original roadmap are now built: Core Foundation, Sales Intelligence,
Financial System, Builder Operations, and the AI Assistant Layer. What's out of scope for this
delivery — flagged honestly rather than silently skipped:

- **Real backend wiring beyond auth.** Supabase authentication is live; every other module
  (leads, bookings, construction, etc.) still reads from `lib/mock-data.ts`. The schema and types
  already match column-for-column, so swapping each module to real Supabase queries is a
  data-layer change, not a redesign — but it hasn't been done module-by-module yet.
- **Untested live AI calls.** I can't reach `api.openai.com` or provision a live Supabase project
  from this sandbox, so every OpenAI-backed route and the Supabase auth flow are wired correctly
  by inspection and a clean build, but not verified against real credentials — try them with your
  own keys and let me know if anything needs adjusting.
- **The "vector DB for customer memory"** mentioned in the original Phase 1 AI stack (for longer-
  term conversational memory across sessions) isn't implemented — the Copilot today is grounded in
  live CRM data per-request rather than a persisted memory store.
- **Premium visual polish items not yet built**: the interactive tower/floor/unit selection map is
  simplified to the floor-wise heatmap (functionally equivalent, visually simpler), and the Builder
  Health Score is a single composite widget rather than a dedicated page.


## Phase 6 — Full Supabase data layer (this delivery): mock data removed

`lib/mock-data.ts` is gone. Every page and widget now reads and writes real data through a
single client-side data layer, `lib/data/CrmDataProvider.tsx` (mounted once in `app/layout.tsx`,
above every route). It:

- Fetches every org-scoped table (`org_users`, `projects`, `units`, `leads`, `customers` +
  timeline, `site_visits`, `bookings` + `payment_milestones`, `broker_commissions`,
  `construction_stages`, `tasks`, `site_reports`, `project_documents`, `compliance_items`) for the
  signed-in user's organization, and maps DB rows to the existing `lib/types.ts` shapes
  (`lib/data/mappers.ts`) — so every existing component keeps its original props and layout.
- Computes derived values the same way `lib/mock-data.ts` used to (KPIs, revenue trend, lead
  funnel, sales leaderboard, AI lead scoring/closing probability, revenue forecast) from that real
  data instead of hardcoded numbers.
- Exposes typed mutations — `createLead`, `updateLeadStage`, `createSiteVisit`,
  `updateSiteVisitStatus`, `createBooking` (auto-generates the 4-milestone payment plan),
  `createProjectWithUnits` (auto-generates every tower/floor/unit), `createTask`,
  `updateTaskStatus`, `createDocument`, `updateDocumentStatus` — called from `useCrmData()`
  anywhere in the app.

Every "Add / New / Schedule / Invite / Upload" button that was previously decorative now opens a
real form (`components/shared/dialogs/*.tsx`, built on the already-installed
`@radix-ui/react-dialog`) that writes to Supabase and refreshes the view. No page layout, styling,
or component was redesigned — only wired up.

**Team invites** (`Sales Team → Invite Member`) are a small end-to-end feature of their own:
`app/api/org/invite/route.ts` sends a Supabase auth email invite and records a pending row in the
new `org_invites` table (`supabase/migrations/003_org_invites.sql`); `app/auth/callback/route.ts`
completes the acceptance server-side (via the service-role admin client in `lib/supabase/admin.ts`,
which bypasses RLS) by adding the invited user to that organization instead of sending them through
onboarding.

**Security fix:** `supabase/migrations/004_tighten_org_users_rls.sql` closes a privilege-escalation
gap in `002_self_serve_onboarding.sql`'s `org_users` insert policy, which only checked
`user_id = auth.uid()` — meaning any authenticated user could add themselves to *any* organization
with *any* role. It's replaced with a policy that only allows the one case the app actually needs
client-side: becoming the first (`Owner`) member of a brand-new org. Run every file in
`supabase/migrations/` in order, in addition to `supabase/schema.sql`.

**AI Copilot** (`/assistant`, `lib/ai/copilot-engine.ts`) now takes its data as a parameter
(`CrmSnapshot`) instead of importing mock data — `app/api/ai/copilot/route.ts` builds that snapshot
per-request from the signed-in user's real org data (`lib/data/server-snapshot.ts`) before
answering, so its answers (and the optional OpenAI-powered narration) are grounded in what's
actually in your CRM.

**Optional demo data:** `supabase/seed.sql` seeds one organization with realistic projects, units,
leads, customers, bookings, tasks, etc. so a fresh org isn't empty — see the comment at the top of
that file for how to point it at your org id. It's entirely optional; the app itself never reads
from it or from any mock data.

### Setup checklist

1. `npm install`
2. Create a Supabase project, then in the SQL editor run, in order: `supabase/schema.sql`, then
   every file in `supabase/migrations/` (`002_...`, `003_...`, `004_...`).
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
   `OPENAI_API_KEY` is optional.
4. In Supabase Auth settings, add your dev/prod URL(s) to the redirect allow-list
   (`<origin>/auth/callback`).
5. `npm run dev`, sign up, and complete onboarding — you're now an Owner of a brand-new,
   empty organization. Add a project, a lead, a booking, etc. through the UI, or run
   `supabase/seed.sql` for sample data first.
