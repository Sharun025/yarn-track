export const BATCH_SELECT =
  "*,process:processes(id,name,slug),bom_template:bom_templates(id,code,name),supervisor:profiles(id,display_name,role)";

export const BOM_TEMPLATE_SELECT =
  "*,process:processes(id,name,slug),components:bom_template_items(id,expected_quantity,unit,position,item:items(id,sku,name,unit,unit_cost))";

export const BATCH_MOVEMENT_SELECT =
  "*,from_process:processes(id,name,slug),to_process:processes(id,name,slug)";

export const BATCH_MOVEMENT_WITH_BATCH_SELECT =
  `${BATCH_MOVEMENT_SELECT},batch:batches(id,code,process_id)`;

export const BOM_USAGE_SELECT =
  "*,item:items(id,sku,name,unit)";
