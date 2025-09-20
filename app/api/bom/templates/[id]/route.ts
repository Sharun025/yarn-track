import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BOM_TEMPLATE_INCLUDE } from "@/lib/selects";
import { prisma } from "@/lib/prisma";
import { bomTemplateUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.bomTemplate.findUnique({
      where: { id: params.id },
      include: BOM_TEMPLATE_INCLUDE,
    });

    if (!template) {
      return failure("BOM template not found", { status: 404 });
    }

    return success(template);
  } catch (error) {
    return failure("Unable to fetch BOM template", {
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
  const parsed = bomTemplateUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid BOM template payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const existing = await prisma.bomTemplate.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return failure("BOM template not found", { status: 404 });
  }

  const {
    code,
    name,
    processId,
    outputItemId,
    outputQuantity,
    instructions,
    isActive,
    components,
  } = parsed.data;

  const data: Prisma.BomTemplateUpdateInput = {};

  if (code !== undefined) data.code = code;
  if (name !== undefined) data.name = name;
  if (processId !== undefined) data.process_id = processId;
  if (outputItemId !== undefined) data.output_item_id = outputItemId ?? null;
  if (outputQuantity !== undefined) data.output_quantity = outputQuantity ?? null;
  if (instructions !== undefined) data.instructions = instructions ?? null;
  if (isActive !== undefined) data.is_active = isActive;

  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.bomTemplate.update({
          where: { id: params.id },
          data,
        });
      }

      if (components !== undefined) {
        await tx.bomTemplateItem.deleteMany({
          where: { bom_template_id: params.id },
        });

        if (components.length > 0) {
          await tx.bomTemplateItem.createMany({
            data: components.map((component, index) => ({
              bom_template_id: params.id,
              item_id: component.itemId,
              expected_quantity: component.expectedQuantity,
              unit: component.unit,
              position: component.position ?? index,
            })),
          });
        }
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return failure("Unable to update BOM template", {
        status: 409,
        details: error.message,
      });
    }

    return failure("Unable to update BOM template", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const template = await prisma.bomTemplate.findUnique({
      where: { id: params.id },
      include: BOM_TEMPLATE_INCLUDE,
    });

    if (!template) {
      return failure("BOM template not found", { status: 404 });
    }

    return success(template);
  } catch (error) {
    return failure("Updated template but unable to retrieve", {
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
    await prisma.bomTemplate.delete({
      where: { id: params.id },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return failure("BOM template not found", { status: 404 });
    }

    return failure("Unable to delete BOM template", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return new NextResponse(null, { status: 204 });
}
