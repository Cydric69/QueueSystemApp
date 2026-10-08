// src/lib/api.ts

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export type FieldError = { field: string; message: string };

// Matches the backend's error shape: { success: false, message, errors? }
export class ApiError extends Error {
  status: number;
  errors: FieldError[];

  constructor(message: string, status: number, errors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  // Convert to { "student.firstName": "message" } for form inputs
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.errors.map((e) => [e.field, e.message]));
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export async function api<T = unknown>(
  path: string,
  { method = "GET", body, signal, timeoutMs = 15000 }: RequestOptions = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError("EXPO_PUBLIC_API_URL is not set", 0);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener("abort", () => controller.abort());

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new ApiError(
        json?.message ?? "Something went wrong. Please try again.",
        res.status,
        json?.errors ?? [],
      );
    }

    return (json?.data ?? json) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new ApiError("The request timed out. Check your connection.", 0);
    }
    throw new ApiError("Cannot reach the server. Check your connection.", 0);
  } finally {
    clearTimeout(timer);
  }
}
