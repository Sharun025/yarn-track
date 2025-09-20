import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { workerShiftUpdateSchema } from "@/lib/validation";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const body = await request.json().catch(() => null);
  const parsed = workerShiftUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid shift payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.startTime !== undefined) updates.start_time = parsed.data.startTime;
  if (parsed.data.endTime !== undefined) updates.end_time = parsed.data.endTime;
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;

  if (Object.keys(updates).length === 0) {
    return failure("No updates provided", { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("worker_shifts")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return failure("Unable to update shift", {
      status,
      details: error.message,
    });
  }

  return success(data);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from("worker_shifts").delete().eq("id", id);

  if (error) {
    return failure("Unable to delete shift", {
      status: 500,
      details: error.message,
    });
  }

  return success(null, 204);
}
