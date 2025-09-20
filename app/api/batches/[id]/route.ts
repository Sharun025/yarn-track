import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BATCH_SELECT } from "@/lib/selects";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { batchUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
  } catch (error) {
    return failure("Unable to fetch batch", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
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

  const data: Record<string, unknown> = {};

  if (code !== undefined) data.code = code;
  if (processId !== undefined) data.process_id = processId;
  if (bomTemplateId !== undefined) data.bom_template_id = bomTemplateId ?? null;
  if (status !== undefined) data.status = status ?? null;
  if (plannedQuantity !== undefined) data.planned_quantity = plannedQuantity ?? null;
  if (inputQuantity !== undefined) data.input_quantity = inputQuantity ?? null;
  if (outputQuantity !== undefined) data.output_quantity = outputQuantity ?? null;
  if (wastagePercentage !== undefined)
    data.wastage_percentage = wastagePercentage ?? null;
  if (startedAt !== undefined) data.started_at = startedAt ?? null;
  if (completedAt !== undefined) data.completed_at = completedAt ?? null;
  if (supervisorId !== undefined) data.supervisor_id = supervisorId ?? null;
  if (createdBy !== undefined) data.created_by = createdBy ?? null;
  if (notes !== undefined) data.notes = notes ?? null;

  if (Object.keys(data).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: updated, error } = await supabase
      .from("batches")
      .update(data)
      .eq("id", params.id)
      .select(BATCH_SELECT)
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return failure("Unable to update batch", {
          status: 409,
          details: error.message,
        });
      }

      return failure("Unable to update batch", {
        status: 500,
        details: error.message,
      });
    }

    if (!updated) {
      return failure("Batch not found", { status: 404 });
    }

    return success(updated);
  } catch (error) {
    return failure("Unable to update batch", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { error, count } = await supabase
      .from("batches")
      .delete({ count: "exact" })
      .eq("id", params.id);

    if (error) {
      return failure("Unable to delete batch", {
        status: 500,
        details: error.message,
      });
    }

    if (!count) {
      return failure("Batch not found", { status: 404 });
    }

  } catch (error) {
    return failure("Unable to delete batch", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return new NextResponse(null, { status: 204 });
}
