import { NextRequest } from "next/server";

import { failure, success } from "@/lib/apiHelpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { vendorCreateSchema } from "@/lib/validation";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return failure("Unable to fetch vendors", {
      status: 500,
      details: error.message,
    });
  }

  return success(data ?? []);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = vendorCreateSchema.safeParse(body);

  if (!parsed.success) {
    return failure("Invalid vendor payload", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const supabase = getSupabaseServerClient();
  const payload = {
    name: parsed.data.name,
    contact_info: parsed.data.contactInfo ?? null,
    description: parsed.data.description ?? null,
    is_active: parsed.data.isActive ?? true,
  };

  const { data, error } = await supabase
    .from("vendors")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return failure("Unable to create vendor", {
      status,
      details: error.message,
    });
  }

  return success(data, 201);
}
