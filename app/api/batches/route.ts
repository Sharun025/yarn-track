import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { BATCH_SELECT } from "@/lib/selects";
import { batchCreateSchema, batchStatusValues } from "@/lib/validation";

const parseStatusFilter = (value: string) => {
  const items = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const allowed = new Set(batchStatusValues);
  return items.filter((item) => allowed.has(item as (typeof batchStatusValues)[number]));
};

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const processId = searchParams.get("processId");
  const statusParam = searchParams.get("status");

  let query = supabase
    .from("batches")
    .select(BATCH_SELECT)
    .order("created_at", { ascending: false });

  if (processId) {
    query = query.eq("process_id", processId);
  }

  if (statusParam) {
    const statuses = parseStatusFilter(statusParam);
    if (statuses.length === 1) {
      query = query.eq("status", statuses[0]);
    } else if (statuses.length > 1) {
      query = query.in("status", statuses);
    }
  }

  const { data, error } = await query;

  if (error) {
    return failure("Unable to fetch batches", {
      status: 500,
      details: error.message,
    });
  }

  return success(data ?? []);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = batchCreateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid batch payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const supabase = getSupabaseServerClient();
  const {
    code,
    processId,
    bomTemplateId,
    status,
    plannedQuantity,
    inputQuantity,
    outputQuantity,
    wastagePercentage,
    startedAt,
    completedAt,
    supervisorId,
    createdBy,
    notes,
  } = parsed.data;

  const payload = {
    code,
    process_id: processId,
    bom_template_id: bomTemplateId ?? null,
    status: status ?? "scheduled",
    planned_quantity: plannedQuantity ?? null,
    input_quantity: inputQuantity ?? null,
    output_quantity: outputQuantity ?? null,
    wastage_percentage: wastagePercentage ?? null,
    started_at: startedAt ?? null,
    completed_at: completedAt ?? null,
    supervisor_id: supervisorId ?? null,
    created_by: createdBy ?? null,
    notes: notes ?? null,
  };

  const { data, error } = await supabase
    .from("batches")
    .insert(payload)
    .select(BATCH_SELECT)
    .single();

  if (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    return failure("Unable to create batch", {
      status: statusCode,
      details: error.message,
    });
  }

  return success(data, 201);
}
