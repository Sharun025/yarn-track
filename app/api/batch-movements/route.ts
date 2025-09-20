import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BATCH_MOVEMENT_WITH_BATCH_INCLUDE } from "@/lib/selects";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 10;

export async function GET(request: NextRequest) {
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

  const where = processId
    ? {
        OR: [{ from_process_id: processId }, { to_process_id: processId }],
      }
    : undefined;

  try {
    const movements = await prisma.batchMovement.findMany({
      where,
      orderBy: { occurred_at: "desc" },
      take: limit,
      include: BATCH_MOVEMENT_WITH_BATCH_INCLUDE,
    });

    return success(movements);
  } catch (error) {
    return failure("Unable to fetch batch movements", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
