-- Seed data intentionally left empty.
-- Add environment-specific seeds as needed once real master data is available.

-- Reference master demo data
insert into public.item_categories (name, description)
values
  ('Raw material', 'Fibers, yarn, and base materials'),
  ('Chemicals', 'Dyes, treatments, and auxiliaries'),
  ('Consumable', 'Packing and consumable supplies')
on conflict (name) do nothing;

insert into public.worker_departments (name, description)
values
  ('Spinning', 'Spinning and twisting operations'),
  ('Dyeing', 'Colouring and finishing department'),
  ('Quality', 'Quality control and inspection')
on conflict (name) do nothing;

insert into public.worker_roles (name, description)
values
  ('Operator', 'Machine operator'),
  ('Supervisor', 'Line supervisor'),
  ('Technician', 'Maintenance technician')
on conflict (name) do nothing;

insert into public.vendors (name, contact_info, description)
values
  ('Cotton Mills Co.', 'cotton@example.com', 'Primary fiber supplier'),
  ('ColorPlus Chemicals', 'support@colorplus.test', 'Dye and chemical supplier')
on conflict (name) do nothing;

insert into public.worker_shifts (name, start_time, end_time, description)
values
  ('Morning', '06:00', '14:00', 'First shift'),
  ('Evening', '14:00', '22:00', 'Second shift'),
  ('Night', '22:00', '06:00', 'Night shift')
on conflict (name) do nothing;
