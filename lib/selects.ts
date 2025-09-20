import type { Prisma } from "@prisma/client";

export const BATCH_INCLUDE: Prisma.BatchInclude = {
  process: {
    select: { id: true, name: true, slug: true },
  },
  bom_template: {
    select: { id: true, code: true, name: true },
  },
  supervisor: {
    select: { id: true, display_name: true, role: true },
  },
};

export const BOM_TEMPLATE_INCLUDE: Prisma.BomTemplateInclude = {
  process: {
    select: { id: true, name: true, slug: true },
  },
  components: {
    select: {
      id: true,
      expected_quantity: true,
      unit: true,
      position: true,
      item: {
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
          unit_cost: true,
        },
      },
    },
    orderBy: { position: "asc" },
  },
};

export const BATCH_MOVEMENT_INCLUDE: Prisma.BatchMovementInclude = {
  from_process: {
    select: { id: true, name: true, slug: true },
  },
  to_process: {
    select: { id: true, name: true, slug: true },
  },
};

export const BATCH_MOVEMENT_WITH_BATCH_INCLUDE: Prisma.BatchMovementInclude = {
  ...BATCH_MOVEMENT_INCLUDE,
  batch: {
    select: { id: true, code: true, process_id: true },
  },
};

export const BOM_USAGE_INCLUDE: Prisma.BomUsageInclude = {
  item: {
    select: { id: true, sku: true, name: true, unit: true },
  },
};
