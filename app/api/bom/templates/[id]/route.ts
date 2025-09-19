import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { BOM_TEMPLATE_SELECT } from "@/lib/selects";
import { bomTemplateUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("bom_templates")
    .select(BOM_TEMPLATE_SELECT)
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return failure("Unable to fetch BOM template", {
      status: 500,
      details: error.message,
    });
  }

  if (!data) {
    return failure("BOM template not found", { status: 404 });
  }

  return success(data);
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

  const supabase = getSupabaseServerClient();
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

  const updates: Record<string, unknown> = {};
  if (code !== undefined) updates.code = code;
  if (name !== undefined) updates.name = name;
  if (processId !== undefined) updates.process_id = processId;
  if (outputItemId !== undefined) updates.output_item_id = outputItemId ?? null;
  if (outputQuantity !== undefined) updates.output_quantity = outputQuantity ?? null;
  if (instructions !== undefined) updates.instructions = instructions ?? null;
  if (isActive !== undefined) updates.is_active = isActive;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("bom_templates")
      .update(updates)
      .eq("id", params.id);

    if (error) {
      const statusCode = error.code === "23505" ? 409 : 500;
      return failure("Unable to update BOM template", {
        status: statusCode,
        details: error.message,
      });
    }
  }

  if (components !== undefined) {
    const { error: deleteError } = await supabase
      .from("bom_template_items")
      .delete()
      .eq("bom_template_id", params.id);

    if (deleteError) {
      return failure("Failed to update BOM components", {
        status: 500,
        details: deleteError.message,
      });
    }

    if (components.length > 0) {
      const componentPayloads = components.map((component, index) => ({
        bom_template_id: params.id,
        item_id: component.itemId,
        expected_quantity: component.expectedQuantity,
        unit: component.unit,
        position: component.position ?? index,
      }));

      const { error: insertError } = await supabase
        .from("bom_template_items")
        .insert(componentPayloads);

      if (insertError) {
        return failure("Failed to upsert BOM components", {
          status: 500,
          details: insertError.message,
        });
      }
    }
  }

  const { data, error: fetchError } = await supabase
    .from("bom_templates")
    .select(BOM_TEMPLATE_SELECT)
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError) {
    return failure("Updated template but unable to retrieve", {
      status: 500,
      details: fetchError.message,
    });
  }

  if (!data) {
    return failure("BOM template not found", { status: 404 });
  }

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("bom_templates")
    .delete()
    .eq("id", params.id);

  if (error) {
    return failure("Unable to delete BOM template", {
      status: 500,
      details: error.message,
    });
  }

  return new NextResponse(null, { status: 204 });
}
