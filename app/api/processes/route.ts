import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";
import { processCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activeFilter = searchParams.get("active");

  const where = activeFilter === "true" ? { is_active: true } : undefined;

  try {
    const processes = await prisma.process.findMany({
      where,
      orderBy: [
        { sequence: { sort: "asc", nulls: "last" } },
        { name: "asc" },
      ],
    });

    return success(processes);
  } catch (error) {
    return failure("Unable to fetch processes", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const parsed = processCreateSchema.safeParse(body);
  if (!parsed.success) {
    return failure("Invalid process payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  try {
    const process = await prisma.process.create({
      data: {
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        sequence: parsed.data.sequence ?? null,
        is_active: parsed.data.isActive ?? true,
      },
    });

    return success(process, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to create process", {
        status: 409,
        details: error.message,
      });
    }

    return failure("Unable to create process", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
