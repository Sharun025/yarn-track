import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { uomCreateSchema } from "@/lib/validation";

const normalizeStatus = (status: string | null) => {
  if (!status) return null;
  const normalized = status.trim().toLowerCase();
  if (normalized === "active") return true;
  if (normalized === "inactive") return false;
  return null;
};

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const status = normalizeStatus(searchParams.get("status"));
  const search = searchParams.get("search");

  let query = supabase.from("uoms").select("*").order("code", { ascending: true });

  if (status !== null) {
    query = query.eq("is_active", status);
  }

  if (search) {
    const value = search.trim();
    if (value.length > 0) {
      query = query.or(`code.ilike.%${value}%,name.ilike.%${value}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    return failure("Unable to fetch units of measure", {
      status: 500,
      details: error.message,
    });
  }

  return success(data ?? []);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = uomCreateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid UOM payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const { code, name, type, precision, status, description } = parsed.data;
  const payload = {
    code,
    name,
    type: type ?? null,
    precision: precision ?? null,
    description: description ?? null,
    is_active: status ? status === "Active" : true,
  };

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("uoms")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    return failure("Unable to create unit of measure", {
      status: statusCode,
      details: error.message,
    });
  }

  return success(data, 201);
}
