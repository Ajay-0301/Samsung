import type { RoadReport, ReportStatus } from "../types";

export interface LoginResult {
  ok: boolean;
  message?: string;
}

export interface SessionUser {
  role: "citizen" | "admin";
  fullName: string;
  contact: string;
  token: string;
}

export interface CitizenLoginPayload {
  mode: "create" | "login";
  fullName: string;
  contact: string;
  password: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://127.0.0.1:8010";
const API_TIMEOUT_MS = 15000;

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload?.detail) {
        message = payload.detail;
      }
    } catch {
      // ignore parse errors and keep default message
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function citizenAuth(payload: CitizenLoginPayload): Promise<SessionUser> {
  const path =
    payload.mode === "create"
      ? "/api/auth/citizen/register"
      : "/api/auth/citizen/login";

  const data = await apiRequest<{
    token: string;
    role: "citizen";
    fullName: string;
    contact: string;
  }>(path, {
    method: "POST",
    body: JSON.stringify({
      fullName: payload.fullName,
      contact: payload.contact,
      password: payload.password
    })
  });

  return {
    role: data.role,
    fullName: data.fullName,
    contact: data.contact,
    token: data.token
  };
}

export async function adminAuth(password: string): Promise<SessionUser> {
  const data = await apiRequest<{
    token: string;
    role: "admin";
    fullName: string;
    contact: string;
  }>("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ password })
  });

  return {
    role: data.role,
    fullName: data.fullName,
    contact: data.contact,
    token: data.token
  };
}

export async function fetchReports(token: string): Promise<RoadReport[]> {
  return apiRequest<RoadReport[]>("/api/reports", {}, token);
}

export async function createReport(token: string, report: RoadReport): Promise<RoadReport> {
  return apiRequest<RoadReport>("/api/reports", {
    method: "POST",
    body: JSON.stringify(report)
  }, token);
}

export async function confirmReport(token: string, reportId: string): Promise<RoadReport> {
  return apiRequest<RoadReport>(`/api/reports/${encodeURIComponent(reportId)}/confirm`, {
    method: "PATCH"
  }, token);
}

export async function advanceReportStatus(
  token: string,
  reportId: string,
  nextStatus: ReportStatus
): Promise<RoadReport> {
  return apiRequest<RoadReport>(`/api/reports/${encodeURIComponent(reportId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: nextStatus })
  }, token);
}

export async function saveReportEvidence(
  token: string,
  reportId: string,
  resolutionImageUrl: string
): Promise<RoadReport> {
  return apiRequest<RoadReport>(`/api/reports/${encodeURIComponent(reportId)}/evidence`, {
    method: "PATCH",
    body: JSON.stringify({ resolutionImageUrl })
  }, token);
}

export function mapErrorToLoginResult(error: unknown, fallbackMessage: string): LoginResult {
  if (error instanceof Error && error.message) {
    return { ok: false, message: error.message };
  }
  return { ok: false, message: fallbackMessage };
}

export { API_BASE_URL };
