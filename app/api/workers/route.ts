import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { workerCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const department = searchParams.get("department");

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
      query = query.or(`code.ilike.%${value}%,display_name.ilike.%${value}%`);
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

  const { code, name, role, department, shift, status, contact, skills } = parsed.data;
  const payload = {
    code,
    display_name: name,
    role: role ?? null,
    department: department ?? null,
    shift: shift ?? null,
    status: status ?? null,
    contact: contact ?? null,
    skills: skills ?? null,
  };

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("workers")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    return failure("Unable to create worker", {
      status: statusCode,
      details: error.message,
    });
  }

  return success(data, 201);
}
