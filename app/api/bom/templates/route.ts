import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { BOM_TEMPLATE_SELECT } from "@/lib/selects";
import { bomTemplateCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const processId = searchParams.get("processId");
  const activeOnly = searchParams.get("active");

  let query = supabase
    .from("bom_templates")
    .select(BOM_TEMPLATE_SELECT)
    .order("name", { ascending: true });

  if (processId) {
    query = query.eq("process_id", processId);
  }

  if (activeOnly === "true") {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return failure("Unable to fetch BOM templates", {
      status: 500,
      details: error.message,
    });
  }

  return success(data ?? []);
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

  const supabase = getSupabaseServerClient();
  const templatePayload = {
    code,
    name,
    process_id: processId,
    output_item_id: outputItemId ?? null,
    output_quantity: outputQuantity ?? null,
    instructions: instructions ?? null,
    is_active: isActive ?? true,
  };

  const { data: template, error } = await supabase
    .from("bom_templates")
    .insert(templatePayload)
    .select("*")
    .single();

  if (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    return failure("Unable to create BOM template", {
      status: statusCode,
      details: error.message,
    });
  }

  if (components.length > 0) {
    const componentPayloads = components.map((component, index) => ({
      bom_template_id: template.id,
      item_id: component.itemId,
      expected_quantity: component.expectedQuantity,
      unit: component.unit,
      position: component.position ?? index,
    }));

    const { error: componentError } = await supabase
      .from("bom_template_items")
      .insert(componentPayloads)
      .select("id");

    if (componentError) {
      return failure("Template created but components failed to save", {
        status: 500,
        details: componentError.message,
      });
    }
  }

  const { data: result, error: fetchError } = await supabase
    .from("bom_templates")
    .select(BOM_TEMPLATE_SELECT)
    .eq("id", template.id)
    .maybeSingle();

  if (fetchError) {
    return failure("Template created but could not be retrieved", {
      status: 500,
      details: fetchError.message,
    });
  }

  return success(result, 201);
}
