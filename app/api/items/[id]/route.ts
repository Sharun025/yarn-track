import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";
import { itemUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return failure("Item not found", { status: 404 });
    }

    return success(item);
  } catch (error) {
    return failure("Unable to fetch item", {
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
  const parsed = itemUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid item payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const {
    sku,
    name,
    category,
    unit,
    unitCost,
    reorderLevel,
    status,
    vendor,
    notes,
  } = parsed.data;

  const data: Record<string, unknown> = {};

  if (sku !== undefined) data.sku = sku;
  if (name !== undefined) data.name = name;
  if (category !== undefined) data.category = category ?? null;
  if (unit !== undefined) data.unit = unit;
  if (unitCost !== undefined) data.unit_cost = unitCost ?? null;
  if (reorderLevel !== undefined) data.reorder_level = reorderLevel ?? null;
  if (status !== undefined) data.status = status ?? null;
  if (vendor !== undefined) data.vendor = vendor ?? null;
  if (notes !== undefined) data.notes = notes ?? null;

  if (Object.keys(data).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  try {
    const item = await prisma.item.update({
      where: { id: params.id },
      data,
    });

    return success(item);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to update item", {
        status: 409,
        details: error.message,
      });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return failure("Item not found", { status: 404 });
    }

    return failure("Unable to update item", {
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
    await prisma.item.delete({
      where: { id: params.id },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return failure("Item not found", { status: 404 });
    }

    return failure("Unable to delete item", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return new NextResponse(null, { status: 204 });
}
