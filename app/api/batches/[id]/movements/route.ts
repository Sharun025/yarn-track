import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BATCH_MOVEMENT_SELECT } from "@/lib/selects";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { batchMovementCreateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("batch_movements")
      .select(BATCH_MOVEMENT_SELECT)
      .eq("batch_id", params.id)
      .order("occurred_at", { ascending: false });

    if (error) {
      return failure("Unable to fetch batch movements", {
        status: 500,
        details: error.message,
      });
    }

    return success(data ?? []);
  } catch (error) {
    return failure("Unable to fetch batch movements", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const raw = await request.json().catch(() => null);
  const composed = {
    ...(raw ?? {}),
    batchId: params.id,
  };

  const parsed = batchMovementCreateSchema.safeParse(composed);

  if (!parsed.success) {
    return failure("Invalid batch movement payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const {
    batchId,
    fromProcessId,
    toProcessId,
    quantity,
    occurredAt,
    notes,
    recordedBy,
  } = parsed.data;

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("batch_movements")
      .insert({
        batch_id: batchId,
        from_process_id: fromProcessId ?? null,
        to_process_id: toProcessId ?? null,
        quantity: quantity ?? null,
        occurred_at: occurredAt ?? new Date().toISOString(),
        notes: notes ?? null,
        recorded_by: recordedBy ?? null,
      })
      .select(BATCH_MOVEMENT_SELECT)
      .single();

    if (error) {
      return failure("Unable to create batch movement", {
        status: 500,
        details: error.message,
      });
    }

    return success(data, 201);
  } catch (error) {
    return failure("Unable to create batch movement", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
