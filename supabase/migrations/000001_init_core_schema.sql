-- Core schema for Yarn Tracker backend

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Shared types
create type public.user_role as enum ('admin', 'manager', 'supervisor');
create type public.batch_status as enum (
  'draft',
  'scheduled',
  'in_progress',
  'paused',
  'awaiting_qc',
  'completed',
  'cancelled'
);

-- Utility trigger to manage updated_at columns
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Profiles table extends auth.users with roles/metadata
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'supervisor',
  display_name text not null,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Manufacturing processes
create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  sequence integer,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_processes
  before update on public.processes
  for each row execute function public.set_updated_at();

-- Master list of items tracked in BOM and inventory
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text,
  unit text not null,
  unit_cost numeric(14,4),
  reorder_level numeric(14,4),
  status text,
  vendor text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_items
  before update on public.items
  for each row execute function public.set_updated_at();

-- Bill of Material (BOM) templates
create table if not exists public.bom_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  process_id uuid not null references public.processes (id) on delete cascade,
  output_item_id uuid references public.items (id) on delete set null,
  output_quantity numeric(14,4),
  instructions text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_bom_templates
  before update on public.bom_templates
  for each row execute function public.set_updated_at();

-- Components for each BOM template
create table if not exists public.bom_template_items (
  id uuid primary key default gen_random_uuid(),
  bom_template_id uuid not null references public.bom_templates (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete restrict,
  expected_quantity numeric(14,4) not null,
  unit text not null,
  position integer,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists bom_template_items_unique_component
  on public.bom_template_items (bom_template_id, item_id);

-- Production batches
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  process_id uuid not null references public.processes (id) on delete restrict,
  bom_template_id uuid references public.bom_templates (id) on delete set null,
  status public.batch_status not null default 'scheduled',
  planned_quantity numeric(14,4),
  input_quantity numeric(14,4),
  output_quantity numeric(14,4),
  wastage_percentage numeric(7,4),
  started_at timestamptz,
  completed_at timestamptz,
  supervisor_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_batches
  before update on public.batches
  for each row execute function public.set_updated_at();

create index if not exists batches_process_status_idx
  on public.batches (process_id, status);

-- Track movement of batches between processes
create table if not exists public.batch_movements (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches (id) on delete cascade,
  from_process_id uuid references public.processes (id) on delete set null,
  to_process_id uuid references public.processes (id) on delete set null,
  quantity numeric(14,4),
  recorded_by uuid references public.profiles (id) on delete set null,
  occurred_at timestamptz not null default timezone('utc', now()),
  notes text
);

create index if not exists batch_movements_batch_idx
  on public.batch_movements (batch_id, occurred_at desc);

-- Actual BOM consumption per batch
create table if not exists public.bom_usage (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete restrict,
  expected_quantity numeric(14,4),
  actual_quantity numeric(14,4) not null,
  unit text not null,
  recorded_by uuid references public.profiles (id) on delete set null,
  recorded_at timestamptz not null default timezone('utc', now()),
  notes text
);

create unique index if not exists bom_usage_batch_item_idx
  on public.bom_usage (batch_id, item_id);

-- Row Level Security policies
alter table public.profiles enable row level security;
alter table public.processes enable row level security;
alter table public.items enable row level security;
alter table public.bom_templates enable row level security;
alter table public.bom_template_items enable row level security;
alter table public.batches enable row level security;
alter table public.batch_movements enable row level security;
alter table public.bom_usage enable row level security;

-- Profiles policies
drop policy if exists profiles_self_access_select on public.profiles;
create policy profiles_self_access_select
  on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_self_access_update on public.profiles;
create policy profiles_self_access_update
  on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read
  on public.profiles
  for select using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Generic policies for operational tables (read for authenticated users)
drop policy if exists processes_read on public.processes;
create policy processes_read
  on public.processes for select
  using (auth.role() = 'authenticated');

drop policy if exists items_read on public.items;
create policy items_read
  on public.items for select
  using (auth.role() = 'authenticated');

drop policy if exists bom_templates_read on public.bom_templates;
create policy bom_templates_read
  on public.bom_templates for select
  using (auth.role() = 'authenticated');

drop policy if exists bom_template_items_read on public.bom_template_items;
create policy bom_template_items_read
  on public.bom_template_items for select
  using (auth.role() = 'authenticated');

drop policy if exists batches_read on public.batches;
create policy batches_read
  on public.batches for select
  using (auth.role() = 'authenticated');

drop policy if exists batch_movements_read on public.batch_movements;
create policy batch_movements_read
  on public.batch_movements for select
  using (auth.role() = 'authenticated');

drop policy if exists bom_usage_read on public.bom_usage;
create policy bom_usage_read
  on public.bom_usage for select
  using (auth.role() = 'authenticated');

-- Insert/update policies require elevated role (service role or admin)
drop policy if exists admin_manage_processes on public.processes;
create policy admin_manage_processes
  on public.processes for all
  using (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists admin_manage_items on public.items;
create policy admin_manage_items
  on public.items for all
  using (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists admin_manage_bom_templates on public.bom_templates;
create policy admin_manage_bom_templates
  on public.bom_templates for all
  using (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  )
  with check (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );

drop policy if exists admin_manage_batches on public.batches;
create policy admin_manage_batches
  on public.batches for all
  using (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager', 'supervisor')
    )
  )
  with check (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager', 'supervisor')
    )
  );

drop policy if exists admin_manage_batch_movements on public.batch_movements;
create policy admin_manage_batch_movements
  on public.batch_movements for all
  using (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager', 'supervisor')
    )
  )
  with check (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager', 'supervisor')
    )
  );

drop policy if exists admin_manage_bom_usage on public.bom_usage;
create policy admin_manage_bom_usage
  on public.bom_usage for all
  using (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager', 'supervisor')
    )
  )
  with check (
    (auth.role() = 'service_role') or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager', 'supervisor')
    )
  );
