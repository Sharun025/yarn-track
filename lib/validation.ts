import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const batchStatusValues = [
  "draft",
  "scheduled",
  "in_progress",
  "paused",
  "awaiting_qc",
  "completed",
  "cancelled",
] as const;

export const processCreateSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(slugPattern, "Use lowercase letters, numbers, and hyphens only"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sequence: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const processUpdateSchema = processCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Provide at least one field to update",
  }
);

export const itemCreateSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  unitCost: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  status: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

export const itemUpdateSchema = itemCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Provide at least one field to update",
  }
);

const bomComponentSchema = z.object({
  itemId: z.string().uuid(),
  expectedQuantity: z.number().positive(),
  unit: z.string().min(1, "Unit is required"),
  position: z.number().int().nonnegative().optional(),
});

export const bomTemplateCreateSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  processId: z.string().uuid(),
  outputItemId: z.string().uuid().optional(),
  outputQuantity: z.number().nonnegative().optional(),
  instructions: z.string().optional(),
  isActive: z.boolean().optional(),
  components: z.array(bomComponentSchema).default([]),
});

export const bomTemplateUpdateSchema = bomTemplateCreateSchema
  .extend({
    components: z.array(bomComponentSchema).optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const batchCreateSchema = z.object({
  code: z.string().min(1, "Code is required"),
  processId: z.string().uuid(),
  bomTemplateId: z.string().uuid().optional(),
  status: z.enum(batchStatusValues).optional(),
  plannedQuantity: z.number().nonnegative().optional(),
  inputQuantity: z.number().nonnegative().optional(),
  outputQuantity: z.number().nonnegative().optional(),
  wastagePercentage: z.number().min(0).max(100).optional(),
  startedAt: z.string().datetime({ offset: true }).optional(),
  completedAt: z.string().datetime({ offset: true }).optional(),
  supervisorId: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const batchUpdateSchema = batchCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Provide at least one field to update",
  }
);

export const batchMovementCreateSchema = z.object({
  batchId: z.string().uuid(),
  fromProcessId: z.string().uuid().optional(),
  toProcessId: z.string().uuid().optional(),
  quantity: z.number().nonnegative().optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
  notes: z.string().optional(),
  recordedBy: z.string().uuid().optional(),
});

export const bomUsageCreateSchema = z.object({
  batchId: z.string().uuid(),
  itemId: z.string().uuid(),
  expectedQuantity: z.number().nonnegative().optional(),
  actualQuantity: z.number().nonnegative(),
  unit: z.string().min(1, "Unit is required"),
  notes: z.string().optional(),
  recordedBy: z.string().uuid().optional(),
});

export const bomUsageUpdateSchema = bomUsageCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Provide at least one field to update",
  }
);

export type ProcessCreateInput = z.infer<typeof processCreateSchema>;
export type ProcessUpdateInput = z.infer<typeof processUpdateSchema>;
export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
export type BomTemplateCreateInput = z.infer<typeof bomTemplateCreateSchema>;
export type BomTemplateUpdateInput = z.infer<typeof bomTemplateUpdateSchema>;
export type BatchCreateInput = z.infer<typeof batchCreateSchema>;
export type BatchUpdateInput = z.infer<typeof batchUpdateSchema>;
export type BatchMovementCreateInput = z.infer<
  typeof batchMovementCreateSchema
>;
export type BomUsageCreateInput = z.infer<typeof bomUsageCreateSchema>;
export type BomUsageUpdateInput = z.infer<typeof bomUsageUpdateSchema>;
