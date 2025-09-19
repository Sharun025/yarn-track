import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { itemCreateSchema } from "@/lib/validation";

const buildSearchFilter = (value: string) =>
  `name.ilike.%${value}%,sku.ilike.%${value}%`;

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase.from("items").select("*").order("name", {
    ascending: true,
  });

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(buildSearchFilter(search));
  }

  const { data, error } = await query;

  if (error) {
    return failure("Unable to fetch items", {
      status: 500,
      details: error.message,
    });
  }

  return success(data ?? []);
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

  const supabase = getSupabaseServerClient();
  const payload = {
    sku: parsed.data.sku,
    name: parsed.data.name,
    category: parsed.data.category ?? null,
    unit: parsed.data.unit,
    unit_cost: parsed.data.unitCost ?? null,
    reorder_level: parsed.data.reorderLevel ?? null,
    status: parsed.data.status ?? null,
    vendor: parsed.data.vendor ?? null,
    notes: parsed.data.notes ?? null,
  };

  const { data, error } = await supabase
    .from("items")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return failure("Unable to create item", {
      status,
      details: error.message,
    });
  }

  return success(data, 201);
}
