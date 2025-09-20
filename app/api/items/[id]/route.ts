import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { itemUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
  } catch (error) {
    return failure("Unable to fetch item", {
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
  const parsed = itemUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid item payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

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

  const data: Record<string, unknown> = {};

  if (sku !== undefined) data.sku = sku;
  if (name !== undefined) data.name = name;
  if (category !== undefined) data.category = category ?? null;
  if (unit !== undefined) data.unit = unit;
  if (unitCost !== undefined) data.unit_cost = unitCost ?? null;
  if (reorderLevel !== undefined) data.reorder_level = reorderLevel ?? null;
  if (status !== undefined) data.status = status ?? null;
  if (vendor !== undefined) data.vendor = vendor ?? null;
  if (notes !== undefined) data.notes = notes ?? null;

  if (Object.keys(data).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: updated, error } = await supabase
      .from("items")
      .update(data)
      .eq("id", params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return failure("Unable to update item", {
          status: 409,
          details: error.message,
        });
      }

      return failure("Unable to update item", {
        status: 500,
        details: error.message,
      });
    }

    if (!updated) {
      return failure("Item not found", { status: 404 });
    }

    return success(updated);
  } catch (error) {
    return failure("Unable to update item", {
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
      .from("items")
      .delete({ count: "exact" })
      .eq("id", params.id);

    if (error) {
      return failure("Unable to delete item", {
        status: 500,
        details: error.message,
      });
    }

    if (!count) {
      return failure("Item not found", { status: 404 });
    }

  } catch (error) {
    return failure("Unable to delete item", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return new NextResponse(null, { status: 204 });
}
