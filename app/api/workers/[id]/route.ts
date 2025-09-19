import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { workerUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("workers")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return failure("Unable to fetch worker", {
      status: 500,
      details: error.message,
    });
  }

  if (!data) {
    return failure("Worker not found", { status: 404 });
  }

  return success(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  const parsed = workerUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid worker payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const updates: Record<string, unknown> = {};
  const { code, name, role, department, shift, status, contact, skills } = parsed.data;

  if (code !== undefined) updates.code = code;
  if (name !== undefined) updates.display_name = name;
  if (role !== undefined) updates.role = role ?? null;
  if (department !== undefined) updates.department = department ?? null;
  if (shift !== undefined) updates.shift = shift ?? null;
  if (status !== undefined) updates.status = status ?? null;
  if (contact !== undefined) updates.contact = contact ?? null;
  if (skills !== undefined) updates.skills = skills ?? null;

  if (Object.keys(updates).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("workers")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    return failure("Unable to update worker", {
      status: statusCode,
      details: error.message,
    });
  }

  if (!data) {
    return failure("Worker not found", { status: 404 });
  }

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("workers")
    .delete()
    .eq("id", params.id);

  if (error) {
    return failure("Unable to delete worker", {
      status: 500,
      details: error.message,
    });
  }

  return new NextResponse(null, { status: 204 });
}
