import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";
import { itemCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Prisma.ItemWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    const value = search.trim();
    if (value.length > 0) {
      where.OR = [
        { name: { contains: value, mode: "insensitive" } },
        { sku: { contains: value, mode: "insensitive" } },
      ];
    }
  }

  try {
    const items = await prisma.item.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return success(items);
  } catch (error) {
    return failure("Unable to fetch items", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = itemCreateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid item payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  try {
    const item = await prisma.item.create({
      data: {
        sku: parsed.data.sku,
        name: parsed.data.name,
        category: parsed.data.category ?? null,
        unit: parsed.data.unit,
        unit_cost: parsed.data.unitCost ?? null,
        reorder_level: parsed.data.reorderLevel ?? null,
        status: parsed.data.status ?? null,
        vendor: parsed.data.vendor ?? null,
        notes: parsed.data.notes ?? null,
      },
    });

    return success(item, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to create item", {
        status: 409,
        details: error.message,
      });
    }

    return failure("Unable to create item", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
