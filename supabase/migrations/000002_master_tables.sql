-- Additional master tables for Yarn Tracker

-- Units of Measure master
create table if not exists public.uoms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text,
  precision integer,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_uoms
  before update on public.uoms
  for each row execute function public.set_updated_at();

-- Worker master
create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  role text,
  department text,
  shift text,
  status text,
  contact text,
  skills text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_workers
  before update on public.workers
  for each row execute function public.set_updated_at();

-- Association of processes to workers
create table if not exists public.process_workers (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes (id) on delete cascade,
  worker_id uuid not null references public.workers (id) on delete cascade,
  assignment_notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists process_workers_unique_assignment
  on public.process_workers (process_id, worker_id);

-- Enable RLS
alter table public.uoms enable row level security;
alter table public.workers enable row level security;
alter table public.process_workers enable row level security;

drop policy if exists uoms_read_authenticated on public.uoms;
create policy uoms_read_authenticated
  on public.uoms for select
  using (auth.role() = 'authenticated');

drop policy if exists workers_read_authenticated on public.workers;
create policy workers_read_authenticated
  on public.workers for select
  using (auth.role() = 'authenticated');

drop policy if exists process_workers_read_authenticated on public.process_workers;
create policy process_workers_read_authenticated
  on public.process_workers for select
  using (auth.role() = 'authenticated');

-- Policies: service role or admins manage entries
drop policy if exists uoms_manage_admin on public.uoms;
create policy uoms_manage_admin
  on public.uoms for all
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

drop policy if exists workers_manage_admin on public.workers;
create policy workers_manage_admin
  on public.workers for all
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

drop policy if exists process_workers_manage_admin on public.process_workers;
create policy process_workers_manage_admin
  on public.process_workers for all
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
