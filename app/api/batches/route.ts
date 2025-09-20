import { Prisma, batch_status } from "@prisma/client";
import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BATCH_INCLUDE } from "@/lib/selects";
import { prisma } from "@/lib/prisma";
import { batchCreateSchema, batchStatusValues } from "@/lib/validation";

const parseStatusFilter = (value: string) => {
  const items = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const allowed = new Set(batchStatusValues);
  return items.filter((item) => allowed.has(item as (typeof batchStatusValues)[number]));
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const processId = searchParams.get("processId");
  const statusParam = searchParams.get("status");

  const where: Prisma.BatchWhereInput = {};

  if (processId) {
    where.process_id = processId;
  }

  if (statusParam) {
    const statuses = parseStatusFilter(statusParam);
    if (statuses.length === 1) {
      where.status = statuses[0] as batch_status;
    } else if (statuses.length > 1) {
      where.status = { in: statuses as batch_status[] };
    }
  }

  try {
    const batches = await prisma.batch.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: BATCH_INCLUDE,
    });

    return success(batches);
  } catch (error) {
    return failure("Unable to fetch batches", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = batchCreateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid batch payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const {
    code,
    processId,
    bomTemplateId,
    status,
    plannedQuantity,
    inputQuantity,
    outputQuantity,
    wastagePercentage,
    startedAt,
    completedAt,
    supervisorId,
    createdBy,
    notes,
  } = parsed.data;

  try {
    const batch = await prisma.batch.create({
      data: {
        code,
        process_id: processId,
        bom_template_id: bomTemplateId ?? null,
        status: (status ?? "scheduled") as batch_status,
        planned_quantity: plannedQuantity ?? null,
        input_quantity: inputQuantity ?? null,
        output_quantity: outputQuantity ?? null,
        wastage_percentage: wastagePercentage ?? null,
        started_at: startedAt ?? null,
        completed_at: completedAt ?? null,
        supervisor_id: supervisorId ?? null,
        created_by: createdBy ?? null,
        notes: notes ?? null,
      },
      include: BATCH_INCLUDE,
    });

    return success(batch, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to create batch", {
        status: 409,
        details: error.message,
      });
    }

    return failure("Unable to create batch", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
