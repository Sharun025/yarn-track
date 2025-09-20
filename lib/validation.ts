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

export const uomStatusValues = ["Active", "Inactive"] as const;
export const workerStatusValues = ["Active", "On leave", "Inactive"] as const;

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

export const uomCreateSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  type: z.string().optional(),
  precision: z.number().int().min(0).max(6).optional(),
  status: z.enum(uomStatusValues).optional(),
  description: z.string().optional(),
});

export const uomUpdateSchema = uomCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Provide at least one field to update",
  }
);

export const workerCreateSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  role: z.string().optional(),
  department: z.string().optional(),
  shift: z.string().optional(),
  status: z.enum(workerStatusValues).optional(),
  contact: z.string().optional(),
  skills: z.string().optional(),
});

export const workerUpdateSchema = workerCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Provide at least one field to update",
  }
);

export const simpleMasterCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const simpleMasterUpdateSchema = simpleMasterCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Provide at least one field to update",
  }
);

export const vendorCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactInfo: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const vendorUpdateSchema = vendorCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Provide at least one field to update",
  }
);

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const workerShiftCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  startTime: z.string().regex(timePattern, "Use HH:MM format").optional(),
  endTime: z.string().regex(timePattern, "Use HH:MM format").optional(),
  isActive: z.boolean().optional(),
});

export const workerShiftUpdateSchema = z
  .object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().nullable().optional(),
    startTime: z.union([z.string().regex(timePattern, "Use HH:MM format"), z.null()]).optional(),
    endTime: z.union([z.string().regex(timePattern, "Use HH:MM format"), z.null()]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

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
export type UomCreateInput = z.infer<typeof uomCreateSchema>;
export type UomUpdateInput = z.infer<typeof uomUpdateSchema>;
export type WorkerCreateInput = z.infer<typeof workerCreateSchema>;
export type WorkerUpdateInput = z.infer<typeof workerUpdateSchema>;
export type BomTemplateCreateInput = z.infer<typeof bomTemplateCreateSchema>;
export type BomTemplateUpdateInput = z.infer<typeof bomTemplateUpdateSchema>;
export type BatchCreateInput = z.infer<typeof batchCreateSchema>;
export type BatchUpdateInput = z.infer<typeof batchUpdateSchema>;
export type BatchMovementCreateInput = z.infer<
  typeof batchMovementCreateSchema
>;
export type BomUsageCreateInput = z.infer<typeof bomUsageCreateSchema>;
export type BomUsageUpdateInput = z.infer<typeof bomUsageUpdateSchema>;
export type SimpleMasterCreateInput = z.infer<typeof simpleMasterCreateSchema>;
export type SimpleMasterUpdateInput = z.infer<typeof simpleMasterUpdateSchema>;
export type VendorCreateInput = z.infer<typeof vendorCreateSchema>;
export type VendorUpdateInput = z.infer<typeof vendorUpdateSchema>;
export type WorkerShiftCreateInput = z.infer<typeof workerShiftCreateSchema>;
export type WorkerShiftUpdateInput = z.infer<typeof workerShiftUpdateSchema>;
