import type { ApiEnvelope } from "@/lib/types";

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]> | null;

  constructor(message: string, status: number, errors: Record<string, string[]> | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return "http://127.0.0.1:8000/api";
  return base.replace(/\/$/, "");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("solo_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) localStorage.removeItem("solo_token");
  else localStorage.setItem("solo_token", token);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = options.token ?? getToken();

  const headers = new Headers(options.headers);
  // Для FormData нельзя выставлять Content-Type вручную — браузер добавит boundary.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Token ${token}`);

  const res = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (res.status === 204) {
    return undefined as T;
  }

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // ignore
  }

  if (!res.ok || !payload?.success) {
    const errors = payload?.errors ?? { non_field_errors: ["Ошибка запроса"] };
    const message =
      errors?.non_field_errors?.[0] ||
      Object.values(errors || {})?.[0]?.[0] ||
      `Ошибка ${res.status}`;
    throw new ApiError(message, res.status, errors);
  }

  return payload.data as T;
}

export async function apiGet<T>(path: string, token?: string | null) {
  return apiRequest<T>(path, { method: "GET", token });
}

export async function apiPost<T>(path: string, body: unknown, token?: string | null) {
  return apiRequest<T>(path, { method: "POST", body: JSON.stringify(body), token });
}

export async function apiPostForm<T>(path: string, form: FormData, token?: string | null) {
  return apiRequest<T>(path, { method: "POST", body: form, token });
}

export async function apiPatch<T>(path: string, body: unknown, token?: string | null) {
  return apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body), token });
}

export async function apiDelete<T>(path: string, token?: string | null) {
  return apiRequest<T>(path, { method: "DELETE", token });
}
