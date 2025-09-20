import { NextRequest, NextResponse } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BOM_TEMPLATE_SELECT } from "@/lib/selects";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { bomTemplateUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("bom_templates")
      .select(BOM_TEMPLATE_SELECT)
      .eq("id", params.id)
      .order("position", { ascending: true, foreignTable: "components" })
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

  const supabase = getSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("bom_templates")
    .select(
      "id, components:bom_template_items(id,item_id,expected_quantity,unit,position)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (existingError) {
    return failure("Unable to fetch BOM template", {
      status: 500,
      details: existingError.message,
    });
  }

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

  const data: Record<string, unknown> = {};

  if (code !== undefined) data.code = code;
  if (name !== undefined) data.name = name;
  if (processId !== undefined) data.process_id = processId;
  if (outputItemId !== undefined) data.output_item_id = outputItemId ?? null;
  if (outputQuantity !== undefined) data.output_quantity = outputQuantity ?? null;
  if (instructions !== undefined) data.instructions = instructions ?? null;
  if (isActive !== undefined) data.is_active = isActive;

  try {
    if (Object.keys(data).length > 0) {
      const { error: updateError } = await supabase
        .from("bom_templates")
        .update(data)
        .eq("id", params.id);

      if (updateError) {
        if (updateError.code === "23505") {
          return failure("Unable to update BOM template", {
            status: 409,
            details: updateError.message,
          });
        }

        return failure("Unable to update BOM template", {
          status: 500,
          details: updateError.message,
        });
      }
    }

    if (components !== undefined) {
      const previousComponents = existing.components ?? [];

      const { error: deleteError } = await supabase
        .from("bom_template_items")
        .delete()
        .eq("bom_template_id", params.id);

      if (deleteError) {
        return failure("Unable to update BOM template components", {
          status: 500,
          details: deleteError.message,
        });
      }

      if (components.length > 0) {
        const payload = components.map((component, index) => ({
          bom_template_id: params.id,
          item_id: component.itemId,
          expected_quantity: component.expectedQuantity,
          unit: component.unit,
          position: component.position ?? index,
        }));

        const { error: insertError } = await supabase
          .from("bom_template_items")
          .insert(payload);

        if (insertError) {
          if (previousComponents.length > 0) {
            await supabase.from("bom_template_items").insert(
              previousComponents.map((component) => ({
                bom_template_id: params.id,
                item_id: component.item_id,
                expected_quantity: component.expected_quantity,
                unit: component.unit,
                position: component.position,
              }))
            );
          }

          if (insertError.code === "23505") {
            return failure("Unable to update BOM template", {
              status: 409,
              details: insertError.message,
            });
          }

          return failure("Unable to update BOM template components", {
            status: 500,
            details: insertError.message,
          });
        }
      }
    }

    const { data: template, error: fetchError } = await supabase
      .from("bom_templates")
      .select(BOM_TEMPLATE_SELECT)
      .eq("id", params.id)
      .order("position", { ascending: true, foreignTable: "components" })
      .maybeSingle();

    if (fetchError) {
      return failure("Updated template but unable to retrieve", {
        status: 500,
        details: fetchError.message,
      });
    }

    if (!template) {
      return failure("BOM template not found", { status: 404 });
    }

    return success(template);
  } catch (error) {
    return failure("Unable to update BOM template", {
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
    const supabase = getSupabaseServerClient();
    const { error, count } = await supabase
      .from("bom_templates")
      .delete({ count: "exact" })
      .eq("id", params.id);

    if (error) {
      return failure("Unable to delete BOM template", {
        status: 500,
        details: error.message,
      });
    }

    if (!count) {
      return failure("BOM template not found", { status: 404 });
    }

  } catch (error) {
    return failure("Unable to delete BOM template", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return new NextResponse(null, { status: 204 });
}
