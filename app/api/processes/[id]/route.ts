import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { processUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
  } catch (error) {
    return failure("Unable to fetch process", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
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

  const { slug, name, description, sequence, isActive } = parsed.data;

  const data: Record<string, unknown> = {};

  if (slug !== undefined) data.slug = slug;
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description ?? null;
  if (sequence !== undefined) data.sequence = sequence ?? null;
  if (isActive !== undefined) data.is_active = isActive;

  if (Object.keys(data).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: updated, error } = await supabase
      .from("processes")
      .update(data)
      .eq("id", params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return failure("Unable to update process", {
          status: 409,
          details: error.message,
        });
      }

      return failure("Unable to update process", {
        status: 500,
        details: error.message,
      });
    }

    if (!updated) {
      return failure("Process not found", { status: 404 });
    }

    return success(updated);
  } catch (error) {
    return failure("Unable to update process", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { error, count } = await supabase
      .from("processes")
      .delete({ count: "exact" })
      .eq("id", params.id);

    if (error) {
      return failure("Unable to delete process", {
        status: 500,
        details: error.message,
      });
    }

    if (!count) {
      return failure("Process not found", { status: 404 });
    }

  } catch (error) {
    return failure("Unable to delete process", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return new NextResponse(null, { status: 204 });
}
