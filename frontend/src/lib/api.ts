import type { RuntimeConfig } from "../types/runtimeConfig";

const ADMIN_TOKEN_KEY = "jarvis.admin.api.token.v1";

export type BackendStatus = "live" | "local" | "unconfigured";

export type DashboardApiResponse = {
  backendStatus: BackendStatus;
  generatedAt?: string;
  metrics?: {
    sourceEvents?: number;
    sourceCount?: number;
    trustAvg?: number;
    highConfidence?: number;
    latestRunType?: string;
    latestItemCount?: number;
  };
  briefingItems?: unknown[];
  sourceStatuses?: unknown[];
  activity?: unknown[];
};

export type RuntimeConfigApiResponse = {
  config: RuntimeConfig | null;
  configId: string;
  updatedAt: string | null;
};

export function getAdminToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
}

export function saveAdminToken(token: string) {
  if (typeof window === "undefined") return;
  if (token.trim()) {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
  } else {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

export async function fetchDashboard() {
  return apiFetch<DashboardApiResponse>("/api/dashboard");
}

export async function fetchRuntimeConfig() {
  return apiFetch<RuntimeConfigApiResponse>("/api/runtime-config");
}

export async function saveRuntimeConfig(config: RuntimeConfig, adminToken = getAdminToken()) {
  return apiFetch<{ ok: true; configId: string; updatedAt: string }>("/api/runtime-config", {
    method: "PUT",
    adminToken,
    body: JSON.stringify({ config })
  });
}

export async function triggerBriefingRun(runType: "morning" | "evening" | "manual" = "manual", adminToken = getAdminToken()) {
  return apiFetch<{ ok: true; runType: string; workflow: string; ref: string }>("/api/run-briefing", {
    method: "POST",
    adminToken,
    body: JSON.stringify({ run_type: runType })
  });
}

async function apiFetch<T>(path: string, init: RequestInit & { adminToken?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (init.adminToken) headers.set("x-jarvis-admin-token", init.adminToken);

  const response = await fetch(path, {
    ...init,
    headers
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : `API request failed: ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

