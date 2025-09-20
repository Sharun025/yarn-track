import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { BOM_TEMPLATE_SELECT } from "@/lib/selects";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { bomTemplateCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const processId = searchParams.get("processId");
  const activeOnly = searchParams.get("active");

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("bom_templates")
      .select(BOM_TEMPLATE_SELECT)
      .order("name", { ascending: true })
      .order("position", { ascending: true, foreignTable: "components" });

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
    const supabase = getSupabaseServerClient();
    const { data: template, error: templateError } = await supabase
      .from("bom_templates")
      .insert({
        code,
        name,
        process_id: processId,
        output_item_id: outputItemId ?? null,
        output_quantity: outputQuantity ?? null,
        instructions: instructions ?? null,
        is_active: isActive ?? true,
      })
      .select("id")
      .single();

    if (templateError) {
      if (templateError.code === "23505") {
        return failure("Unable to create BOM template", {
          status: 409,
          details: templateError.message,
        });
      }

      return failure("Unable to create BOM template", {
        status: 500,
        details: templateError.message,
      });
    }

    if (components.length > 0) {
      const payload = components.map((component, index) => ({
        bom_template_id: template.id,
        item_id: component.itemId,
        expected_quantity: component.expectedQuantity,
        unit: component.unit,
        position: component.position ?? index,
      }));

      const { error: componentsError } = await supabase
        .from("bom_template_items")
        .insert(payload);

      if (componentsError) {
        await supabase.from("bom_templates").delete().eq("id", template.id);

        if (componentsError.code === "23505") {
          return failure("Unable to create BOM template", {
            status: 409,
            details: componentsError.message,
          });
        }

        return failure("Unable to create BOM template components", {
          status: 500,
          details: componentsError.message,
        });
      }
    }

    const { data: result, error: fetchError } = await supabase
      .from("bom_templates")
      .select(BOM_TEMPLATE_SELECT)
      .eq("id", template.id)
      .order("position", { ascending: true, foreignTable: "components" })
      .maybeSingle();

    if (fetchError) {
      return failure("Template created but could not be retrieved", {
        status: 500,
        details: fetchError.message,
      });
    }

    if (!result) {
      return failure("Template created but could not be retrieved", {
        status: 500,
      });
    }

    return success(result, 201);
  } catch (error) {
    return failure("Unable to create BOM template", {
      status: 500,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
