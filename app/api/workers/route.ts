import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { buildIlikePattern } from "@/lib/utils";
import { workerCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const department = searchParams.get("department");

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("workers")
      .select("*")
      .order("display_name", { ascending: true })
      .order("code", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    if (department) {
      query = query.eq("department", department);
    }

    if (search) {
      const value = search.trim();
      if (value.length > 0) {
        const pattern = buildIlikePattern(value);
        query = query.or(
          `code.ilike.${pattern},display_name.ilike.${pattern}`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      return failure("Unable to fetch workers", {
        status: 500,
        details: error.message,
      });
    }

    return success(data ?? []);
  } catch (error) {
    return failure("Unable to fetch workers", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = workerCreateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid worker payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const { code, name, role, department, shift, status, contact, skills } =
    parsed.data;

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("workers")
      .insert({
        code,
        display_name: name,
        role: role ?? null,
        department: department ?? null,
        shift: shift ?? null,
        status: status ?? null,
        contact: contact ?? null,
        skills: skills ?? null,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return failure("Unable to create worker", {
          status: 409,
          details: error.message,
        });
      }

      return failure("Unable to create worker", {
        status: 500,
        details: error.message,
      });
    }

    return success(data, 201);
  } catch (error) {
    return failure("Unable to create worker", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
