import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { workerUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
  } catch (error) {
    return failure("Unable to fetch worker", {
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
  const parsed = workerUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid worker payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const { code, name, role, department, shift, status, contact, skills } =
    parsed.data;

  const data: Record<string, unknown> = {};

  if (code !== undefined) data.code = code;
  if (name !== undefined) data.display_name = name;
  if (role !== undefined) data.role = role ?? null;
  if (department !== undefined) data.department = department ?? null;
  if (shift !== undefined) data.shift = shift ?? null;
  if (status !== undefined) data.status = status ?? null;
  if (contact !== undefined) data.contact = contact ?? null;
  if (skills !== undefined) data.skills = skills ?? null;

  if (Object.keys(data).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: updated, error } = await supabase
      .from("workers")
      .update(data)
      .eq("id", params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return failure("Unable to update worker", {
          status: 409,
          details: error.message,
        });
      }

      return failure("Unable to update worker", {
        status: 500,
        details: error.message,
      });
    }

    if (!updated) {
      return failure("Worker not found", { status: 404 });
    }

    return success(updated);
  } catch (error) {
    return failure("Unable to update worker", {
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
      .from("workers")
      .delete({ count: "exact" })
      .eq("id", params.id);

    if (error) {
      return failure("Unable to delete worker", {
        status: 500,
        details: error.message,
      });
    }

    if (!count) {
      return failure("Worker not found", { status: 404 });
    }

  } catch (error) {
    return failure("Unable to delete worker", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return new NextResponse(null, { status: 204 });
}
