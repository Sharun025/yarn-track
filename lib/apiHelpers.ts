import { NextResponse } from "next/server";

export const success = <T>(data: T, init?: number | ResponseInit) => {
  if (typeof init === "number") {
    return NextResponse.json({ data }, { status: init });
  }
  return NextResponse.json({ data }, init);
};

export const failure = (
  message: string,
  options?: {
    status?: number;
    details?: unknown;
  }
) => {
  const status = options?.status ?? 500;
  const payload = {
    error: message,
    details: options?.details ?? null,
  };
  return NextResponse.json(payload, { status });
};
