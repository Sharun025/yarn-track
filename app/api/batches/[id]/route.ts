import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { BATCH_SELECT } from "@/lib/selects";
import { batchUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("batches")
    .select(BATCH_SELECT)
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return failure("Unable to fetch batch", {
      status: 500,
      details: error.message,
    });
  }

  if (!data) {
    return failure("Batch not found", { status: 404 });
  }

  return success(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  const parsed = batchUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid batch payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

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

  const updates: Record<string, unknown> = {};

  if (code !== undefined) updates.code = code;
  if (processId !== undefined) updates.process_id = processId;
  if (bomTemplateId !== undefined) updates.bom_template_id = bomTemplateId ?? null;
  if (status !== undefined) updates.status = status;
  if (plannedQuantity !== undefined) updates.planned_quantity = plannedQuantity ?? null;
  if (inputQuantity !== undefined) updates.input_quantity = inputQuantity ?? null;
  if (outputQuantity !== undefined) updates.output_quantity = outputQuantity ?? null;
  if (wastagePercentage !== undefined)
    updates.wastage_percentage = wastagePercentage ?? null;
  if (startedAt !== undefined) updates.started_at = startedAt ?? null;
  if (completedAt !== undefined) updates.completed_at = completedAt ?? null;
  if (supervisorId !== undefined) updates.supervisor_id = supervisorId ?? null;
  if (createdBy !== undefined) updates.created_by = createdBy ?? null;
  if (notes !== undefined) updates.notes = notes ?? null;

  if (Object.keys(updates).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("batches")
    .update(updates)
    .eq("id", params.id)
    .select(BATCH_SELECT)
    .maybeSingle();

  if (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    return failure("Unable to update batch", {
      status: statusCode,
      details: error.message,
    });
  }

  if (!data) {
    return failure("Batch not found", { status: 404 });
  }

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("batches")
    .delete()
    .eq("id", params.id);

  if (error) {
    return failure("Unable to delete batch", {
      status: 500,
      details: error.message,
    });
  }

  return new NextResponse(null, { status: 204 });
}
