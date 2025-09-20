-- Reference master tables for supporting data

-- Item categories master
create table if not exists public.item_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_item_categories
  before update on public.item_categories
  for each row execute function public.set_updated_at();

-- Vendor master
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  contact_info text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_vendors
  before update on public.vendors
  for each row execute function public.set_updated_at();

-- Worker department master
create table if not exists public.worker_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_worker_departments
  before update on public.worker_departments
  for each row execute function public.set_updated_at();

-- Worker role master
create table if not exists public.worker_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_worker_roles
  before update on public.worker_roles
  for each row execute function public.set_updated_at();

-- Worker shift master
create table if not exists public.worker_shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  start_time time,
  end_time time,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_worker_shifts
  before update on public.worker_shifts
  for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.item_categories enable row level security;
alter table public.vendors enable row level security;
alter table public.worker_departments enable row level security;
alter table public.worker_roles enable row level security;
alter table public.worker_shifts enable row level security;

-- Authenticated users can read
create or replace policy item_categories_read_authenticated
  on public.item_categories for select
  using (auth.role() = 'authenticated');

drop policy if exists vendors_read_authenticated on public.vendors;
create policy vendors_read_authenticated
  on public.vendors for select
  using (auth.role() = 'authenticated');

drop policy if exists worker_departments_read_authenticated on public.worker_departments;
create policy worker_departments_read_authenticated
  on public.worker_departments for select
  using (auth.role() = 'authenticated');

drop policy if exists worker_roles_read_authenticated on public.worker_roles;
create policy worker_roles_read_authenticated
  on public.worker_roles for select
  using (auth.role() = 'authenticated');

drop policy if exists worker_shifts_read_authenticated on public.worker_shifts;
create policy worker_shifts_read_authenticated
  on public.worker_shifts for select
  using (auth.role() = 'authenticated');

-- Admins and service role manage records
create or replace policy item_categories_manage_admin
  on public.item_categories for all
  using (
    auth.role() = 'service_role' or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    auth.role() = 'service_role' or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists vendors_manage_admin on public.vendors;
create policy vendors_manage_admin
  on public.vendors for all
  using (
    auth.role() = 'service_role' or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    auth.role() = 'service_role' or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists worker_departments_manage_admin on public.worker_departments;
create policy worker_departments_manage_admin
  on public.worker_departments for all
  using (
    auth.role() = 'service_role' or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    auth.role() = 'service_role' or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists worker_roles_manage_admin on public.worker_roles;
create policy worker_roles_manage_admin
  on public.worker_roles for all
  using (
    auth.role() = 'service_role' or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    auth.role() = 'service_role' or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists worker_shifts_manage_admin on public.worker_shifts;
create policy worker_shifts_manage_admin
  on public.worker_shifts for all
  using (
    auth.role() = 'service_role' or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    auth.role() = 'service_role' or
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
