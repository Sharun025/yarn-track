import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { processCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const activeFilter = searchParams.get("active");

  let query = supabase
    .from("processes")
    .select("*")
    .order("sequence", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (activeFilter === "true") {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return failure("Unable to fetch processes", {
      status: 500,
      details: error.message,
    });
  }

  return success(data ?? []);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const parsed = processCreateSchema.safeParse(body);
  if (!parsed.success) {
    return failure("Invalid process payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const supabase = getSupabaseServerClient();
  const payload = {
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    sequence: parsed.data.sequence ?? null,
    is_active: parsed.data.isActive ?? true,
  };

  const { data, error } = await supabase
    .from("processes")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return failure("Unable to create process", {
      status,
      details: error.message,
    });
  }

  return success(data, 201);
}
