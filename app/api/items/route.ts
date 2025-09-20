import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { buildIlikePattern } from "@/lib/utils";
import { itemCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase.from("items").select("*").order("name", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      const value = search.trim();
      if (value.length > 0) {
        const pattern = buildIlikePattern(value);
        query = query.or(
          `name.ilike.${pattern},sku.ilike.${pattern}`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      return failure("Unable to fetch items", {
        status: 500,
        details: error.message,
      });
    }

    return success(data ?? []);
  } catch (error) {
    return failure("Unable to fetch items", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = itemCreateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid item payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("items")
      .insert({
        sku: parsed.data.sku,
        name: parsed.data.name,
        category: parsed.data.category ?? null,
        unit: parsed.data.unit,
        unit_cost: parsed.data.unitCost ?? null,
        reorder_level: parsed.data.reorderLevel ?? null,
        status: parsed.data.status ?? null,
        vendor: parsed.data.vendor ?? null,
        notes: parsed.data.notes ?? null,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return failure("Unable to create item", {
          status: 409,
          details: error.message,
        });
      }

      return failure("Unable to create item", {
        status: 500,
        details: error.message,
      });
    }

    return success(data, 201);
  } catch (error) {
    return failure("Unable to create item", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
