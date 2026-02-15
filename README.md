# 🏗 Project Context: FRANCIS SAYS NO

## 🎯 Product Vision

We are building a renovation budget intelligence dashboard targeted at:
	•	BTO buyers
	•	Resale flat purchasers
	•	First-time homeowners in Singapore

The goal is not to create a spreadsheet replacement.

The goal is to create:

A zero-setup renovation financial control center that provides clarity, insight, and proactive guidance during renovation.

This product must:
	•	Reduce renovation stress
	•	Prevent overspending
	•	Surface actionable insights
	•	Require minimal setup
	•	Provide instant visual clarity

It must be simple, opinionated, and intelligent.

⸻

## 🧠 Core Product Philosophy

This is not:
	•	A contractor marketplace
	•	A Pinterest board
	•	A hyper-configurable accounting system

It is:
	•	A structured renovation operating system
	•	A financial tracking + insight engine
	•	A proactive dashboard that interprets data

The key differentiation from Google Sheets:
	•	No manual formulas
	•	No pivot table setup
	•	No manual chart configuration
	•	Built-in health score
	•	Automatic insights
	•	Opinionated defaults

User enters expenses.
System interprets the meaning.

⸻

## 🧱 Target MVP Capabilities

Users must be able to:
	1.	Create a renovation project (budget)
	2.	Define zones (rooms)
	3.	Create wishlist items per zone with allocated budgets
	4.	Add multiple expenses per wishlist item
	5.	See:
	•	Budget vs spent
	•	Remaining per item
	•	Remaining per zone
	•	Remaining overall
	6.	View a budget health score
	7.	Receive proactive insights such as:
	•	Overspending warnings
	•	Surplus suggestions
	•	Near-completion alerts
	•	Burn rate indicators

⸻

## 🗄 Database Model (Current + Adjustments)

Existing tables:
	•	budgets
	•	zones
	•	wishlist_items
	•	purchased_items

Adjusted model direction:

budgets (acts as project)

Represents a renovation project.
Must support user ownership (user_id via Supabase Auth).

zones

Rooms within a budget.

wishlist_items

Items planned per zone.
Must include:
	•	budget (allocated amount)
	•	status (not_started | in_progress | completed)

expenses (NEW — required)

Canonical financial tracking table.

Each wishlist item can have multiple expenses.
All financial calculations must derive from:

SUM(expenses.amount)

purchased_items may be deprecated later, but not required for MVP.

### Existing Schemas

create table public.budgets (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  total_budget numeric(12, 2) not null default 0,
  currency text null default 'SGD'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint budgets_pkey primary key (id)
) TABLESPACE pg_default;

create table public.purchased_items (
  id uuid not null default extensions.uuid_generate_v4 (),
  wishlist_item_id uuid not null,
  name text not null,
  model_name text null,
  brand text null,
  store_name text null,
  price numeric(12, 2) not null,
  discount numeric(12, 2) null default 0,
  cashback_received numeric(12, 2) null default 0,
  warranty_period_years numeric(4, 2) null,
  notes text null,
  url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  amount_paid numeric(12, 2) not null default 0.00,
  balance numeric(12, 2) null,
  paid_by text null,
  purchase_date timestamp with time zone null,
  constraint items_pkey primary key (id),
  constraint items_wishlist_item_id_fkey foreign KEY (wishlist_item_id) references wishlist_items (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_items_wishlist_item_id on public.purchased_items using btree (wishlist_item_id) TABLESPACE pg_default;

create table public.wishlist_items (
  id uuid not null default extensions.uuid_generate_v4 (),
  zone_id uuid not null,
  name text not null,
  estimated_price numeric(12, 2) null default 0,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  budget numeric(12, 2) null,
  constraint wishlist_items_pkey primary key (id),
  constraint wishlist_items_zone_id_fkey foreign KEY (zone_id) references zones (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_wishlist_items_zone_id on public.wishlist_items using btree (zone_id) TABLESPACE pg_default;

create table public.zones (
  id uuid not null default extensions.uuid_generate_v4 (),
  budget_id uuid not null,
  name text not null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint zones_pkey primary key (id),
  constraint zones_budget_id_fkey foreign KEY (budget_id) references budgets (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_zones_budget_id on public.zones using btree (budget_id) TABLESPACE pg_default;

⸻

## 🧮 Financial Intelligence Model

All insights derive from:
	•	Total budget (budgets.total_budget)
	•	Allocated wishlist budgets
	•	Sum of expenses grouped by:
	•	wishlist item
	•	zone
	•	project

Core calculations:
	•	Remaining per wishlist item
	•	Remaining per zone
	•	Remaining overall
	•	Overspend detection
	•	Completion ratio
	•	Budget health score

The system must compute, not store, intelligence.

No heavy business logic in UI.

⸻

## 🖥 Technical Stack

Frontend:
	•	Next.js (App Router)
	•	React (latest)
	•	TypeScript (strict)
	•	Tailwind CSS
	•	CSS variables for theme
	•	Dark mode enabled
	•	Design language:
	•	White, black, greys
	•	Border radius = 0
	•	Minimal dashboard aesthetic
	•	Inter (Google Font)

State + Data:
	•	Zustand (global UI state only)
	•	React Query (client-side fetching)
	•	Modular service layer
	•	Short, scalable functions
	•	No tight coupling

Auth:
	•	Firebase Auth
	•	Abstracted via service layer

Deployment:
	•	Static compatible
	•	Deployable to Vercel or Firebase App Hosting
	•	Free-tier friendly
	•	No required server runtime

⸻

## 📂 Required Folder Structure

/app
/components/ui
/hooks
/services
/store
/lib
/types

Architecture rules:
	•	No business logic inside components
	•	No direct SDK usage inside UI components
	•	Services handle data access
	•	Hooks orchestrate data
	•	Zustand handles shared UI state
	•	React Query handles async state

Everything must be modular and replaceable.

⸻

## 🚫 What We Are NOT Building (MVP Scope)
	•	Marketplace
	•	Contractor matching
	•	AI chat assistant
	•	Benchmarking across users
	•	Mobile app
	•	Complex financial forecasting
	•	Server-heavy logic

Keep it lean.

⸻

## 🎯 Long-Term Direction

This product may evolve into:
	•	Renovation financial OS
	•	Benchmarking engine
	•	Predictive overrun detection
	•	Cross-user cost analytics

But MVP focuses on: Clean tracking + intelligent interpretation.