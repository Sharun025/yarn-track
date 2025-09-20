import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BOM_TEMPLATE_INCLUDE } from "@/lib/selects";
import { prisma } from "@/lib/prisma";
import { bomTemplateCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const processId = searchParams.get("processId");
  const activeOnly = searchParams.get("active");

  const where: Prisma.BomTemplateWhereInput = {};

  if (processId) {
    where.process_id = processId;
  }

  if (activeOnly === "true") {
    where.is_active = true;
  }

  try {
    const templates = await prisma.bomTemplate.findMany({
      where,
      orderBy: { name: "asc" },
      include: BOM_TEMPLATE_INCLUDE,
    });

    return success(templates);
  } catch (error) {
    return failure("Unable to fetch BOM templates", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bomTemplateCreateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid BOM template payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const { code, name, processId, outputItemId, outputQuantity, instructions, isActive } =
    parsed.data;
  const components = parsed.data.components ?? [];

  try {
    const template = await prisma.$transaction(async (tx) => {
      const created = await tx.bomTemplate.create({
        data: {
          code,
          name,
          process_id: processId,
          output_item_id: outputItemId ?? null,
          output_quantity: outputQuantity ?? null,
          instructions: instructions ?? null,
          is_active: isActive ?? true,
        },
      });

      if (components.length > 0) {
        await tx.bomTemplateItem.createMany({
          data: components.map((component, index) => ({
            bom_template_id: created.id,
            item_id: component.itemId,
            expected_quantity: component.expectedQuantity,
            unit: component.unit,
            position: component.position ?? index,
          })),
        });
      }

      return created;
    });

    const result = await prisma.bomTemplate.findUnique({
      where: { id: template.id },
      include: BOM_TEMPLATE_INCLUDE,
    });

    if (!result) {
      return failure("Template created but could not be retrieved", {
        status: 500,
      });
    }

    return success(result, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to create BOM template", {
        status: 409,
        details: error.message,
      });
    }

    return failure("Unable to create BOM template", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
