import { authStorage } from "@/lib/auth-storage";
import type {
  CreateSessionPayload,
  FilterOption,
  HistoryStep,
  SessionResponse,
} from "@/lib/types";

const API_URL = "https://trieduc-prd-alb-1277017021.us-east-1.elb.amazonaws.com";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = authStorage.getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    const body = await res.clone().json().catch(() => ({}));
    console.warn(
      `[auth] ${res.status} em ${path}. Limpando sessão. detail:`,
      body?.detail ?? body
    );
    authStorage.clearAuth();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
    }
    throw new ApiError("Sessão expirada", res.status);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.detail || `Erro ${res.status}`, res.status);
  }

  return res.json();
}

export const catApi = {
  getFilters(): Promise<FilterOption[]> {
    return request("/api/v1/cat/filters");
  },

  createSession(payload: CreateSessionPayload): Promise<SessionResponse> {
    return request("/api/v1/cat/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  submitAnswer(
    sessionId: string,
    alternativaId: string
  ): Promise<SessionResponse> {
    return request(`/api/v1/cat/sessions/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({ alternativaId }),
    });
  },

  getSession(sessionId: string): Promise<SessionResponse> {
    return request(`/api/v1/cat/sessions/${sessionId}`);
  },

  getHistory(sessionId: string): Promise<HistoryStep[]> {
    return request(`/api/v1/cat/sessions/${sessionId}/history`);
  },
};
