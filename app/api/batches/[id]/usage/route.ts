import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BOM_USAGE_INCLUDE } from "@/lib/selects";
import { prisma } from "@/lib/prisma";
import { bomUsageCreateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usage = await prisma.bomUsage.findMany({
      where: { batch_id: params.id },
      orderBy: { recorded_at: "desc" },
      include: BOM_USAGE_INCLUDE,
    });

    return success(usage);
  } catch (error) {
    return failure("Unable to fetch BOM usage", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const raw = await request.json().catch(() => null);
  const composed = {
    ...(raw ?? {}),
    batchId: params.id,
  };

  const parsed = bomUsageCreateSchema.safeParse(composed);

  if (!parsed.success) {
    return failure("Invalid BOM usage payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const { batchId, itemId, expectedQuantity, actualQuantity, unit, notes, recordedBy } =
    parsed.data;

  try {
    const usage = await prisma.bomUsage.create({
      data: {
        batch_id: batchId,
        item_id: itemId,
        expected_quantity: expectedQuantity ?? null,
        actual_quantity: actualQuantity,
        unit,
        notes: notes ?? null,
        recorded_by: recordedBy ?? null,
      },
      include: BOM_USAGE_INCLUDE,
    });

    return success(usage, 201);
  } catch (error) {
    return failure("Unable to create BOM usage entry", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
