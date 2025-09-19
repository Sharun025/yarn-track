import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BATCH_MOVEMENT_SUMMARY_SELECT } from "@/lib/selects";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

const DEFAULT_LIMIT = 10;

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const processId = searchParams.get("processId");

  let limit = DEFAULT_LIMIT;
  if (limitParam) {
    const parsed = Number.parseInt(limitParam, 10);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 100) {
      limit = parsed;
    }
  }

  let query = supabase
    .from("batch_movements")
    .select(BATCH_MOVEMENT_SUMMARY_SELECT)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (processId) {
    query = query.or(
      `from_process_id.eq.${processId},to_process_id.eq.${processId}`
    );
  }

  const { data, error } = await query;

  if (error) {
    return failure("Unable to fetch batch movements", {
      status: 500,
      details: error.message,
    });
  }

  return success(data ?? []);
}
