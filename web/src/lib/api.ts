/**
 * Cliente HTTP mínimo para a API FastAPI.
 * A URL base vem de VITE_API_URL. Sem proxy — o front fala direto
 * com http://localhost:8000 (configurável).
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  "",
);

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  const body: unknown = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message =
      typeof body === "object" && body && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : res.statusText;
    throw new ApiError(message, res.status, body);
  }

  return body as T;
}

// ──────────────────────────────────────────────
// Tipos públicos (espelham a API)
// ──────────────────────────────────────────────
export type WhisperModelName = "tiny" | "small" | "medium" | "large-v2" | "large-v3";

export interface ModelsResponse {
  default: WhisperModelName;
  available: WhisperModelName[];
  max_upload_size_mb: number;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  probability: number;
}

export interface Segment {
  start: number;
  end: number;
  text: string;
  words: WordTimestamp[];
}

export interface TranscriptionResult {
  model: WhisperModelName;
  language: string;
  language_probability: number;
  duration: number;
  word_timestamps: boolean;
  vad_filter: boolean;
  segments: Segment[];
}

export interface ModelStatusEntry {
  idle_seconds: number;
  unloads_in: number | null;
}

export interface ModelsStatus {
  timeout_seconds: number;
  auto_unload: boolean;
  loaded_models: Record<string, ModelStatusEntry>;
}

export type HistoryFormat = "transcribe" | "srt" | "vtt" | "both";

export interface HistoryEntry {
  id: string;
  original_filename: string;
  format: HistoryFormat;
  language: string;
  model: string;
  size_bytes: number;
  duration: number;
  created_at: number;
  audio_url: string;
  has_transcript: boolean;
  has_srt: boolean;
  has_vtt: boolean;
}

export interface HistoryDetail extends HistoryEntry {
  payload: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// Endpoints
// ──────────────────────────────────────────────
export const api = {
  baseUrl: BASE_URL,

  listModels: () => request<ModelsResponse>("/api/v1/models"),

  modelsStatus: () => request<ModelsStatus>("/api/v1/models/status"),

  unloadModel: (name: WhisperModelName) =>
    request<{ message: string }>(`/api/v1/models/${name}/unload`, {
      method: "POST",
    }),

  transcribe: (form: FormData) =>
    request<TranscriptionResult>("/api/v1/transcribe", {
      method: "POST",
      body: form,
    }),

  subtitleSrt: (form: FormData) =>
    request<string>("/api/v1/subtitle/srt", {
      method: "POST",
      body: form,
      headers: { Accept: "text/plain" },
    }),

  subtitleVtt: (form: FormData) =>
    request<string>("/api/v1/subtitle/vtt", {
      method: "POST",
      body: form,
      headers: { Accept: "text/vtt" },
    }),

  subtitleBoth: (form: FormData) =>
    request<{ srt: string; vtt: string; model: WhisperModelName }>(
      "/api/v1/subtitle/both",
      { method: "POST", body: form },
    ),

  listHistory: () => request<HistoryEntry[]>("/api/v1/history"),
  getHistory: (id: string) => request<HistoryDetail>(`/api/v1/history/${id}`),
  deleteHistory: (id: string) =>
    request<{ message: string }>(`/api/v1/history/${id}`, { method: "DELETE" }),
  clearHistory: () =>
    request<{ message: string }>("/api/v1/history", { method: "DELETE" }),

  audioUrl: (id: string) => `${BASE_URL}/api/v1/history/${id}/audio`,
};
