import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";
import { processUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const process = await prisma.process.findUnique({
      where: { id: params.id },
    });

    if (!process) {
      return failure("Process not found", { status: 404 });
    }

    return success(process);
  } catch (error) {
    return failure("Unable to fetch process", {
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
  const parsed = processUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid process payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const { slug, name, description, sequence, isActive } = parsed.data;

  const data: Record<string, unknown> = {};

  if (slug !== undefined) data.slug = slug;
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description ?? null;
  if (sequence !== undefined) data.sequence = sequence ?? null;
  if (isActive !== undefined) data.is_active = isActive;

  if (Object.keys(data).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  try {
    const process = await prisma.process.update({
      where: { id: params.id },
      data,
    });

    return success(process);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to update process", {
        status: 409,
        details: error.message,
      });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return failure("Process not found", { status: 404 });
    }

    return failure("Unable to update process", {
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
    await prisma.process.delete({
      where: { id: params.id },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return failure("Process not found", { status: 404 });
    }

    return failure("Unable to delete process", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return new NextResponse(null, { status: 204 });
}
