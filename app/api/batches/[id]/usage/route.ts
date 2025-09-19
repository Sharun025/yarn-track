import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BOM_USAGE_SELECT } from "@/lib/selects";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { bomUsageCreateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("bom_usage")
    .select(BOM_USAGE_SELECT)
    .eq("batch_id", params.id)
    .order("recorded_at", { ascending: false });

  if (error) {
    return failure("Unable to fetch BOM usage", {
      status: 500,
      details: error.message,
    });
  }

  return success(data ?? []);
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

  const parsed = bomUsageCreateSchema.safeParse(composed);

  if (!parsed.success) {
    return failure("Invalid BOM usage payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const {
    batchId,
    itemId,
    expectedQuantity,
    actualQuantity,
    unit,
    notes,
    recordedBy,
  } = parsed.data;

  const supabase = getSupabaseServerClient();
  const payload = {
    batch_id: batchId,
    item_id: itemId,
    expected_quantity: expectedQuantity ?? null,
    actual_quantity: actualQuantity,
    unit,
    notes: notes ?? null,
    recorded_by: recordedBy ?? null,
  };

  const { data, error } = await supabase
    .from("bom_usage")
    .insert(payload)
    .select(BOM_USAGE_SELECT)
    .single();

  if (error) {
    return failure("Unable to create BOM usage entry", {
      status: 500,
      details: error.message,
    });
  }

  return success(data, 201);
}
