import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";
import { uomCreateSchema } from "@/lib/validation";

const normalizeStatus = (status: string | null) => {
  if (!status) return null;
  const normalized = status.trim().toLowerCase();
  if (normalized === "active") return true;
  if (normalized === "inactive") return false;
  return null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = normalizeStatus(searchParams.get("status"));
  const search = searchParams.get("search");

  const where: Prisma.UomWhereInput = {};

  if (status !== null) {
    where.is_active = status;
  }

  if (search) {
    const value = search.trim();
    if (value.length > 0) {
      where.OR = [
        { code: { contains: value, mode: "insensitive" } },
        { name: { contains: value, mode: "insensitive" } },
      ];
    }
  }

  try {
    const uoms = await prisma.uom.findMany({
      where,
      orderBy: { code: "asc" },
    });

    return success(uoms);
  } catch (error) {
    return failure("Unable to fetch units of measure", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = uomCreateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid UOM payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const { code, name, type, precision, status, description } = parsed.data;

  try {
    const uom = await prisma.uom.create({
      data: {
        code,
        name,
        type: type ?? null,
        precision: precision ?? null,
        description: description ?? null,
        is_active: status ? status === "Active" : true,
      },
    });

    return success(uom, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to create unit of measure", {
        status: 409,
        details: error.message,
      });
    }

    return failure("Unable to create unit of measure", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
