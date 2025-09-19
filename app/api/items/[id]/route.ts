import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { itemUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return failure("Unable to fetch item", {
      status: 500,
      details: error.message,
    });
  }

  if (!data) {
    return failure("Item not found", { status: 404 });
  }

  return success(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  const parsed = itemUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid item payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const updates: Record<string, unknown> = {};
  const {
    sku,
    name,
    category,
    unit,
    unitCost,
    reorderLevel,
    status,
    vendor,
    notes,
  } = parsed.data;

  if (sku !== undefined) updates.sku = sku;
  if (name !== undefined) updates.name = name;
  if (category !== undefined) updates.category = category ?? null;
  if (unit !== undefined) updates.unit = unit;
  if (unitCost !== undefined) updates.unit_cost = unitCost ?? null;
  if (reorderLevel !== undefined) updates.reorder_level = reorderLevel ?? null;
  if (status !== undefined) updates.status = status ?? null;
  if (vendor !== undefined) updates.vendor = vendor ?? null;
  if (notes !== undefined) updates.notes = notes ?? null;

  if (Object.keys(updates).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("items")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    return failure("Unable to update item", {
      status: statusCode,
      details: error.message,
    });
  }

  if (!data) {
    return failure("Item not found", { status: 404 });
  }

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", params.id);

  if (error) {
    return failure("Unable to delete item", {
      status: 500,
      details: error.message,
    });
  }

  return new NextResponse(null, { status: 204 });
}
