-- Demo seed data for Yarn Tracker
-- Safe to run multiple times thanks to ON CONFLICT upserts

-- Processes ---------------------------------------------------------------
insert into public.processes (slug, name, description, sequence, is_active)
values
  ('soaking', 'Soaking', 'Condition silk cocoons in controlled vats.', 1, true),
  ('hank-winding', 'Hank Winding', 'Wind soaked filament onto hanks.', 2, true),
  ('primary-twisting', 'Primary Twisting', 'Apply first level twist to build ply strength.', 3, true),
  ('secondary-twisting', 'Secondary Twisting', 'Equalize and lock primary twist.', 4, true),
  ('vacuum-heat-setting', 'Vacuum Heat Setting', 'Stabilize twisted yarn under vacuum and heat.', 5, true),
  ('silk-warping', 'Silk Warping', 'Arrange yarn into warp beams with precise tension.', 6, true)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      sequence = excluded.sequence,
      is_active = true;

-- Items ------------------------------------------------------------------
insert into public.items (sku, name, category, unit, unit_cost, reorder_level, status, vendor, notes)
values
  ('RM-SLK-COCOON', 'Raw Silk Cocoon', 'Raw material', 'kg', 145.00, 200.0, 'Active', 'SilkWorks Co.', 'Base raw material for soaking'),
  ('SFG-SLK-SOK-30D', 'Soaked Silk 30 Denier', 'Semi-finished goods', 'kg', 182.60, 180.0, 'Active', 'SilkWorks Co.', 'Output of soaking'),
  ('SFG-SLK-HNK-30D', 'Hank Wound Silk 30 Denier', 'Semi-finished goods', 'kg', 188.30, 200.0, 'Active', 'SilkWorks Co.', 'Output of hank winding'),
  ('SFG-SLK-PTW-2PLY', 'Primary Twisted Silk 2 Ply', 'Semi-finished goods', 'kg', 198.75, 150.0, 'Active', 'SeriTex Assemblies', 'Output of primary twisting'),
  ('SFG-SLK-STW-2PLY', 'Secondary Twisted Silk 2 Ply', 'Semi-finished goods', 'kg', 209.20, 140.0, 'Active', 'SeriTex Assemblies', 'Output of secondary twisting'),
  ('SFG-SLK-VHS-2PLY', 'Vacuum Heat Set Silk 2 Ply', 'Semi-finished goods', 'kg', 212.00, 150.0, 'Active', 'SeriTex Assemblies', 'Output of heat setting'),
  ('FG-SLK-WARP-5440', 'Finished Silk Warp 5440 Ends', 'Finished goods', 'kg', 228.40, 120.0, 'Active', 'WarpTex', 'Output of silk warping')
on conflict (sku) do update
  set name = excluded.name,
      category = excluded.category,
      unit = excluded.unit,
      unit_cost = excluded.unit_cost,
      reorder_level = excluded.reorder_level,
      status = excluded.status,
      vendor = excluded.vendor,
      notes = excluded.notes;

-- BOM templates ----------------------------------------------------------
insert into public.bom_templates (
  code, name, process_id, output_item_id, output_quantity, instructions, is_active
)
select
  'BOM-HANK-001',
  'Hank Winding – Standard',
  p.id,
  i.id,
  500.0,
  '1. Receive soaked silk.\n2. Wind onto hank frames maintaining uniform tension.\n3. Inspect hanks before release.',
  true
from public.processes p
join public.items i on i.sku = 'SFG-SLK-HNK-30D'
where p.slug = 'hank-winding'
on conflict (code) do update
  set name = excluded.name,
      process_id = excluded.process_id,
      output_item_id = excluded.output_item_id,
      output_quantity = excluded.output_quantity,
      instructions = excluded.instructions,
      is_active = excluded.is_active;

insert into public.bom_templates (
  code, name, process_id, output_item_id, output_quantity, instructions, is_active
)
select
  'BOM-PTW-001',
  'Primary Twisting – Standard',
  p.id,
  i.id,
  480.0,
  '1. Load hank wound silk.\n2. Apply first twist at configured TPI.\n3. Log tensions and release for secondary twist.',
  true
from public.processes p
join public.items i on i.sku = 'SFG-SLK-PTW-2PLY'
where p.slug = 'primary-twisting'
on conflict (code) do update
  set name = excluded.name,
      process_id = excluded.process_id,
      output_item_id = excluded.output_item_id,
      output_quantity = excluded.output_quantity,
      instructions = excluded.instructions,
      is_active = excluded.is_active;

insert into public.bom_templates (
  code, name, process_id, output_item_id, output_quantity, instructions, is_active
)
select
  'BOM-VHS-001',
  'Vacuum Heat Setting – Standard',
  p.id,
  i.id,
  460.0,
  '1. Load secondary twisted silk.\n2. Run vacuum heat cycle for 18 minutes.\n3. Cool and inspect twist stability.',
  true
from public.processes p
join public.items i on i.sku = 'SFG-SLK-VHS-2PLY'
where p.slug = 'vacuum-heat-setting'
on conflict (code) do update
  set name = excluded.name,
      process_id = excluded.process_id,
      output_item_id = excluded.output_item_id,
      output_quantity = excluded.output_quantity,
      instructions = excluded.instructions,
      is_active = excluded.is_active;

-- BOM template items -----------------------------------------------------
with template_map as (
  select code, id from public.bom_templates
), item_map as (
  select sku, id, unit from public.items
)
insert into public.bom_template_items (
  bom_template_id, item_id, expected_quantity, unit, position
)
select tm.id, im.id, data.expected_qty, coalesce(im.unit, data.unit), data.position
from template_map tm
join lateral (
  select * from (values
    ('BOM-HANK-001', 'SFG-SLK-SOK-30D', 520.0, 'kg', 0),
    ('BOM-PTW-001', 'SFG-SLK-HNK-30D', 500.0, 'kg', 0),
    ('BOM-VHS-001', 'SFG-SLK-STW-2PLY', 470.0, 'kg', 0)
  ) as v(template_code, item_sku, expected_qty, unit, position)
  where v.template_code = tm.code
) data on true
join item_map im on im.sku = data.item_sku
on conflict (bom_template_id, item_id) do update
  set expected_quantity = excluded.expected_quantity,
      unit = excluded.unit,
      position = excluded.position;

-- Batches ----------------------------------------------------------------
insert into public.batches (
  code,
  process_id,
  bom_template_id,
  status,
  planned_quantity,
  input_quantity,
  output_quantity,
  wastage_percentage,
  started_at,
  completed_at,
  notes
)
select
  'BATCH-24001',
  p.id,
  t.id,
  'in_progress',
  500.0,
  500.0,
  220.0,
  12.0,
  timezone('utc', now()) - interval '4 hours',
  null,
  'Night shift production run'
from public.processes p
join public.bom_templates t on t.code = 'BOM-HANK-001'
where p.slug = 'hank-winding'
union all
select
  'BATCH-24002',
  p.id,
  t.id,
  'awaiting_qc',
  480.0,
  480.0,
  470.0,
  2.0,
  timezone('utc', now()) - interval '8 hours',
  null,
  'Awaiting QC clearance'
from public.processes p
join public.bom_templates t on t.code = 'BOM-PTW-001'
where p.slug = 'primary-twisting'
union all
select
  'BATCH-24003',
  p.id,
  t.id,
  'completed',
  460.0,
  460.0,
  455.0,
  1.0,
  timezone('utc', now()) - interval '16 hours',
  timezone('utc', now()) - interval '2 hours',
  'Completed without deviations'
from public.processes p
join public.bom_templates t on t.code = 'BOM-VHS-001'
where p.slug = 'vacuum-heat-setting'
on conflict (code) do update
  set process_id = excluded.process_id,
      bom_template_id = excluded.bom_template_id,
      status = excluded.status,
      planned_quantity = excluded.planned_quantity,
      input_quantity = excluded.input_quantity,
      output_quantity = excluded.output_quantity,
      wastage_percentage = excluded.wastage_percentage,
      started_at = excluded.started_at,
      completed_at = excluded.completed_at,
      notes = excluded.notes;

-- Batch movements --------------------------------------------------------
with batch_map as (
  select code, id, process_id from public.batches
)
insert into public.batch_movements (
  batch_id,
  from_process_id,
  to_process_id,
  quantity,
  occurred_at,
  notes
)
select bm_from.id, bm_from.process_id, bm_to.process_id, 220.0,
       timezone('utc', now()) - interval '3 hours',
       'Transferred output for twisting'
from batch_map bm_from
join batch_map bm_to on bm_from.code = 'BATCH-24001' and bm_to.code = 'BATCH-24002'
union all
select bm_from.id, bm_from.process_id, bm_to.process_id, 470.0,
       timezone('utc', now()) - interval '1 hour',
       'Sent for heat setting'
from batch_map bm_from
join batch_map bm_to on bm_from.code = 'BATCH-24002' and bm_to.code = 'BATCH-24003'
on conflict do nothing;

-- BOM usage --------------------------------------------------------------
with batch_map as (
  select code, id from public.batches
), item_map as (
  select sku, id from public.items
)
insert into public.bom_usage (
  batch_id, item_id, expected_quantity, actual_quantity, unit, notes
)
select bm.id, im.id, 520.0, 510.0, 'kg', 'Slight process loss within tolerance'
from batch_map bm
join item_map im on bm.code = 'BATCH-24001' and im.sku = 'SFG-SLK-SOK-30D'
union all
select bm.id, im.id, 500.0, 498.0, 'kg', 'Near perfect output'
from batch_map bm
join item_map im on bm.code = 'BATCH-24002' and im.sku = 'SFG-SLK-HNK-30D'
union all
select bm.id, im.id, 470.0, 465.0, 'kg', 'Includes QA sample deduction'
from batch_map bm
join item_map im on bm.code = 'BATCH-24003' and im.sku = 'SFG-SLK-STW-2PLY'
on conflict (batch_id, item_id) do update
  set expected_quantity = excluded.expected_quantity,
      actual_quantity = excluded.actual_quantity,
      unit = excluded.unit,
      notes = excluded.notes;

-- Helper: insert or update profiles once you have real user IDs  ----------
-- Replace the UUID placeholders below with the auth.users IDs created via the Supabase dashboard.
-- insert into public.profiles (id, role, display_name, phone)
-- values
--   ('00000000-0000-0000-0000-000000000001', 'admin', 'Sharun Admin', '+91 99999 99999'),
--   ('00000000-0000-0000-0000-000000000002', 'manager', 'Factory Manager', '+91 88888 88888'),
--   ('00000000-0000-0000-0000-000000000003', 'supervisor', 'Shift Supervisor', '+91 77777 77777')
-- on conflict (id) do update
--   set role = excluded.role,
--       display_name = excluded.display_name,
--       phone = excluded.phone;
