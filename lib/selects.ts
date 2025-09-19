export const BATCH_SELECT = `*,
  process:processes(id, name, slug),
  bom_template:bom_templates(id, code, name),
  supervisor:profiles(id, display_name, role)
`;

export const BOM_TEMPLATE_SELECT = `*,
  process:processes(id, name, slug),
  components:bom_template_items(
    id,
    expected_quantity,
    unit,
    position,
    item:items(id, sku, name, unit, unit_cost)
  )
`;

export const BATCH_MOVEMENT_SELECT = `id,
  batch_id,
  quantity,
  occurred_at,
  notes,
  recorded_by,
  from_process:processes!batch_movements_from_process_id_fkey(id, name, slug),
  to_process:processes!batch_movements_to_process_id_fkey(id, name, slug)
`;

export const BOM_USAGE_SELECT = `id,
  batch_id,
  expected_quantity,
  actual_quantity,
  unit,
  notes,
  recorded_at,
  recorded_by,
  item:items(id, sku, name, unit)
`;

export const BATCH_MOVEMENT_SUMMARY_SELECT = `id,
  batch:batches(id, code, process_id),
  quantity,
  occurred_at,
  notes,
  recorded_by,
  from_process:processes!batch_movements_from_process_id_fkey(id, name, slug),
  to_process:processes!batch_movements_to_process_id_fkey(id, name, slug)
`;
