import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { processUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("processes")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return failure("Unable to fetch process", {
      status: 500,
      details: error.message,
    });
  }

  if (!data) {
    return failure("Process not found", { status: 404 });
  }

  return success(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  const parsed = processUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid process payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const updates: Record<string, unknown> = {};
  const { slug, name, description, sequence, isActive } = parsed.data;

  if (slug !== undefined) updates.slug = slug;
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description ?? null;
  if (sequence !== undefined) updates.sequence = sequence ?? null;
  if (isActive !== undefined) updates.is_active = isActive;

  if (Object.keys(updates).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("processes")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return failure("Unable to update process", {
      status,
      details: error.message,
    });
  }

  if (!data) {
    return failure("Process not found", { status: 404 });
  }

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("processes")
    .delete()
    .eq("id", params.id);

  if (error) {
    return failure("Unable to delete process", {
      status: 500,
      details: error.message,
    });
  }

  return new NextResponse(null, { status: 204 });
}
