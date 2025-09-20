import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";
import { workerCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const department = searchParams.get("department");

  const where: Prisma.WorkerWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (department) {
    where.department = department;
  }

  if (search) {
    const value = search.trim();
    if (value.length > 0) {
      where.OR = [
        { code: { contains: value, mode: "insensitive" } },
        { display_name: { contains: value, mode: "insensitive" } },
      ];
    }
  }

  try {
    const workers = await prisma.worker.findMany({
      where,
      orderBy: [
        { display_name: "asc" },
        { code: "asc" },
      ],
    });

    return success(workers);
  } catch (error) {
    return failure("Unable to fetch workers", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = workerCreateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid worker payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const { code, name, role, department, shift, status, contact, skills } =
    parsed.data;

  try {
    const worker = await prisma.worker.create({
      data: {
        code,
        display_name: name,
        role: role ?? null,
        department: department ?? null,
        shift: shift ?? null,
        status: status ?? null,
        contact: contact ?? null,
        skills: skills ?? null,
      },
    });

    return success(worker, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to create worker", {
        status: 409,
        details: error.message,
      });
    }

    return failure("Unable to create worker", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
