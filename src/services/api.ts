import type { ApiMethod, ApiResponse, DashboardStats, EntityName, EntityRecord } from "@/types"

const ENV_API_URL = import.meta.env.VITE_API_BASE_URL as string | undefined
const TOKEN_KEY = "empms_admin_token"
const API_URL_OVERRIDE_KEY = "empms_api_url_override"

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ApiError"
  }
}

export function getApiUrl() {
  return (localStorage.getItem(API_URL_OVERRIDE_KEY) ?? ENV_API_URL)?.trim() ?? ""
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? ""
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const payload = text ? (JSON.parse(text) as ApiResponse<T>) : null

  if (!response.ok) {
    throw new ApiError(payload?.message || `Request failed with status ${response.status}`)
  }

  if (!payload?.success) {
    throw new ApiError(payload?.message || "Request failed")
  }

  return payload.data
}

export async function apiRequest<T>(
  route: string,
  method: ApiMethod = "GET",
  data?: unknown,
  params?: Record<string, string>,
) {
  const apiUrl = getApiUrl()

  if (!apiUrl) {
    throw new ApiError("VITE_API_BASE_URL is not configured. Connect the frontend to your deployed Apps Script URL.")
  }

  const token = getToken()
  const url = new URL(apiUrl)
  url.searchParams.set("route", route)
  if (method === "GET") {
    if (token) url.searchParams.set("token", token)
    Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value))
  }

  const response = await fetch(url.toString(), {
    method: method === "GET" ? "GET" : "POST",
    body:
      method === "GET"
        ? undefined
        : JSON.stringify({
            route,
            method,
            token,
            data,
            params,
          }),
  })

  return parseResponse<T>(response)
}

export const api = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; admin: { email: string; name: string } }>("auth", "POST", {
      email,
      password,
    }),
  list: (entity: EntityName) => apiRequest<EntityRecord[]>(entity),
  create: (entity: EntityName, data: EntityRecord) => apiRequest<EntityRecord>(entity, "POST", data),
  update: (entity: EntityName, id: string, data: EntityRecord) => apiRequest<EntityRecord>(entity, "PUT", { id, ...data }),
  remove: (entity: EntityName, id: string) => apiRequest<{ id: string }>(entity, "DELETE", { id }),
  importStudents: (rows: EntityRecord[]) => apiRequest<{ inserted: number; skipped: number; errors: string[] }>("students", "POST", rows, { action: "import" }),
  dashboard: () => apiRequest<DashboardStats>("reports", "GET", undefined, { action: "dashboard" }),
  generateSeating: (examId: string, roomIds: string[]) =>
    apiRequest<{ created: number; roomsUsed: number }>("seating", "POST", { exam_id: examId, room_ids: roomIds }, { action: "generate" }),
  document: (kind: string, payload: EntityRecord) =>
    apiRequest<{ url: string }>("documents", "POST", { kind, ...payload }),
}
