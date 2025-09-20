import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BATCH_MOVEMENT_INCLUDE } from "@/lib/selects";
import { prisma } from "@/lib/prisma";
import { batchMovementCreateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const movements = await prisma.batchMovement.findMany({
      where: { batch_id: params.id },
      orderBy: { occurred_at: "desc" },
      include: BATCH_MOVEMENT_INCLUDE,
    });

    return success(movements);
  } catch (error) {
    return failure("Unable to fetch batch movements", {
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

  const parsed = batchMovementCreateSchema.safeParse(composed);

  if (!parsed.success) {
    return failure("Invalid batch movement payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const {
    batchId,
    fromProcessId,
    toProcessId,
    quantity,
    occurredAt,
    notes,
    recordedBy,
  } = parsed.data;

  try {
    const movement = await prisma.batchMovement.create({
      data: {
        batch_id: batchId,
        from_process_id: fromProcessId ?? null,
        to_process_id: toProcessId ?? null,
        quantity: quantity ?? null,
        occurred_at: occurredAt ?? new Date().toISOString(),
        notes: notes ?? null,
        recorded_by: recordedBy ?? null,
      },
      include: BATCH_MOVEMENT_INCLUDE,
    });

    return success(movement, 201);
  } catch (error) {
    return failure("Unable to create batch movement", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
