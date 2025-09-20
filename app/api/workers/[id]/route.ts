import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";
import { workerUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: params.id },
    });

    if (!worker) {
      return failure("Worker not found", { status: 404 });
    }

    return success(worker);
  } catch (error) {
    return failure("Unable to fetch worker", {
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
  const parsed = workerUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid worker payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const { code, name, role, department, shift, status, contact, skills } =
    parsed.data;

  const data: Record<string, unknown> = {};

  if (code !== undefined) data.code = code;
  if (name !== undefined) data.display_name = name;
  if (role !== undefined) data.role = role ?? null;
  if (department !== undefined) data.department = department ?? null;
  if (shift !== undefined) data.shift = shift ?? null;
  if (status !== undefined) data.status = status ?? null;
  if (contact !== undefined) data.contact = contact ?? null;
  if (skills !== undefined) data.skills = skills ?? null;

  if (Object.keys(data).length === 0) {
    return failure("Nothing to update", { status: 400 });
  }

  try {
    const worker = await prisma.worker.update({
      where: { id: params.id },
      data,
    });

    return success(worker);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to update worker", {
        status: 409,
        details: error.message,
      });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return failure("Worker not found", { status: 404 });
    }

    return failure("Unable to update worker", {
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
    await prisma.worker.delete({
      where: { id: params.id },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return failure("Worker not found", { status: 404 });
    }

    return failure("Unable to delete worker", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return new NextResponse(null, { status: 204 });
}
