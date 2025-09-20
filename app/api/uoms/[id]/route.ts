import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";
import { uomUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uom = await prisma.uom.findUnique({
      where: { id: params.id },
    });

    if (!uom) {
      return failure("Unit of measure not found", { status: 404 });
    }

    return success(uom);
  } catch (error) {
    return failure("Unable to fetch unit of measure", {
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
  const parsed = uomUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid UOM payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const { code, name, type, precision, status, description } = parsed.data;

  const data: Record<string, unknown> = {};

  if (code !== undefined) data.code = code;
  if (name !== undefined) data.name = name;
  if (type !== undefined) data.type = type ?? null;
  if (precision !== undefined) data.precision = precision ?? null;
  if (description !== undefined) data.description = description ?? null;
  if (status !== undefined) data.is_active = status === "Active";

  if (Object.keys(data).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  try {
    const uom = await prisma.uom.update({
      where: { id: params.id },
      data,
    });

    return success(uom);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to update unit of measure", {
        status: 409,
        details: error.message,
      });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return failure("Unit of measure not found", { status: 404 });
    }

    return failure("Unable to update unit of measure", {
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
    await prisma.uom.delete({
      where: { id: params.id },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return failure("Unit of measure not found", { status: 404 });
    }

    return failure("Unable to delete unit of measure", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return new NextResponse(null, { status: 204 });
}
