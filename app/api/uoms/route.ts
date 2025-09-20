import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { buildIlikePattern } from "@/lib/utils";
import { uomCreateSchema } from "@/lib/validation";

const normalizeStatus = (status: string | null) => {
  if (!status) return null;
  const normalized = status.trim().toLowerCase();
  if (normalized === "active") return true;
  if (normalized === "inactive") return false;
  return null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = normalizeStatus(searchParams.get("status"));
  const search = searchParams.get("search");

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase.from("uoms").select("*").order("code", { ascending: true });

    if (status !== null) {
      query = query.eq("is_active", status);
    }

    if (search) {
      const value = search.trim();
      if (value.length > 0) {
        const pattern = buildIlikePattern(value);
        query = query.or(`code.ilike.${pattern},name.ilike.${pattern}`);
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
  } catch (error) {
    return failure("Unable to fetch units of measure", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
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

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("uoms")
      .insert({
        code,
        name,
        type: type ?? null,
        precision: precision ?? null,
        description: description ?? null,
        is_active: status ? status === "Active" : true,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return failure("Unable to create unit of measure", {
          status: 409,
          details: error.message,
        });
      }

      return failure("Unable to create unit of measure", {
        status: 500,
        details: error.message,
      });
    }

    return success(data, 201);
  } catch (error) {
    return failure("Unable to create unit of measure", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
