import { Prisma, batch_status } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BATCH_INCLUDE } from "@/lib/selects";
import { prisma } from "@/lib/prisma";
import { batchUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: params.id },
      include: BATCH_INCLUDE,
    });

    if (!batch) {
      return failure("Batch not found", { status: 404 });
    }

    return success(batch);
  } catch (error) {
    return failure("Unable to fetch batch", {
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
  const parsed = batchUpdateSchema.safeParse(body);

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

  const data: Prisma.BatchUpdateInput = {};

  if (code !== undefined) data.code = code;
  if (processId !== undefined) data.process_id = processId;
  if (bomTemplateId !== undefined) data.bom_template_id = bomTemplateId ?? null;
  if (status !== undefined) data.status = status as batch_status;
  if (plannedQuantity !== undefined) data.planned_quantity = plannedQuantity ?? null;
  if (inputQuantity !== undefined) data.input_quantity = inputQuantity ?? null;
  if (outputQuantity !== undefined) data.output_quantity = outputQuantity ?? null;
  if (wastagePercentage !== undefined)
    data.wastage_percentage = wastagePercentage ?? null;
  if (startedAt !== undefined) data.started_at = startedAt ?? null;
  if (completedAt !== undefined) data.completed_at = completedAt ?? null;
  if (supervisorId !== undefined) data.supervisor_id = supervisorId ?? null;
  if (createdBy !== undefined) data.created_by = createdBy ?? null;
  if (notes !== undefined) data.notes = notes ?? null;

  if (Object.keys(data).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  try {
    const batch = await prisma.batch.update({
      where: { id: params.id },
      data,
      include: BATCH_INCLUDE,
    });

    return success(batch);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to update batch", {
        status: 409,
        details: error.message,
      });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return failure("Batch not found", { status: 404 });
    }

    return failure("Unable to update batch", {
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
    await prisma.batch.delete({
      where: { id: params.id },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return failure("Batch not found", { status: 404 });
    }

    return failure("Unable to delete batch", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return new NextResponse(null, { status: 204 });
}
