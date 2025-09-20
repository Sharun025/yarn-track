import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { processCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activeFilter = searchParams.get("active");

  const where = activeFilter === "true" ? { is_active: true } : undefined;

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("processes")
      .select("*")
      .order("sequence", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (where?.is_active) {
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
  } catch (error) {
    return failure("Unable to fetch processes", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
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

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("processes")
      .insert({
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        sequence: parsed.data.sequence ?? null,
        is_active: parsed.data.isActive ?? true,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return failure("Unable to create process", {
          status: 409,
          details: error.message,
        });
      }

      return failure("Unable to create process", {
        status: 500,
        details: error.message,
      });
    }

    return success(data, 201);
  } catch (error) {
    return failure("Unable to create process", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
