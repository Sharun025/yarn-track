import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { uomUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("uoms")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return failure("Unable to fetch unit of measure", {
      status: 500,
      details: error.message,
    });
  }

  if (!data) {
    return failure("Unit of measure not found", { status: 404 });
  }

  return success(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  const parsed = uomUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid UOM payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const updates: Record<string, unknown> = {};
  const { code, name, type, precision, status, description } = parsed.data;

  if (code !== undefined) updates.code = code;
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type ?? null;
  if (precision !== undefined) updates.precision = precision ?? null;
  if (description !== undefined) updates.description = description ?? null;
  if (status !== undefined) updates.is_active = status === "Active";

  if (Object.keys(updates).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("uoms")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    return failure("Unable to update unit of measure", {
      status: statusCode,
      details: error.message,
    });
  }

  if (!data) {
    return failure("Unit of measure not found", { status: 404 });
  }

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("uoms")
    .delete()
    .eq("id", params.id);

  if (error) {
    return failure("Unable to delete unit of measure", {
      status: 500,
      details: error.message,
    });
  }

  return new NextResponse(null, { status: 204 });
}
