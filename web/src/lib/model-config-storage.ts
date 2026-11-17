import type { ModelConfig } from "./types";

/**
 * Persistence for the model service configuration.
 *
 * Privacy contract (shown in the UI): the API key lives ONLY in browser
 * memory. Everything else (baseUrl, model, transport mode, proxy URL) may
 * be persisted for convenience. This module is the single place that
 * touches localStorage so the guarantee cannot drift again.
 */
export const MODEL_CONFIG_STORAGE_KEY = "slide_recipes_model_config";

/** Minimal storage surface so tests can inject an in-memory fake. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function browserStorage(): StorageLike | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    // Storage can be blocked (private mode / policy); degrade to memory-only.
  }
  return null;
}

/** Strip the secret before anything is written to disk. */
export function sanitizeForPersistence(cfg: ModelConfig): Omit<ModelConfig, "apiKey"> {
  return { baseUrl: cfg.baseUrl, model: cfg.model, mode: cfg.mode, proxyUrl: cfg.proxyUrl };
}

/**
 * Persist non-secret model settings. Never writes the API key, even if the
 * caller passes one. Storage failures are non-fatal.
 */
export function persistModelConfig(cfg: ModelConfig, storage: StorageLike | null = browserStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(MODEL_CONFIG_STORAGE_KEY, JSON.stringify(sanitizeForPersistence(cfg)));
  } catch {
    // Quota exceeded or blocked storage: keep the session working in memory.
  }
}

/**
 * Load persisted settings. The API key always comes back empty (memory-only),
 * and any legacy payload that still contains a key is rewritten without it.
 */
export function loadPersistedModelConfig(storage: StorageLike | null = browserStorage()): Partial<ModelConfig> {
  if (!storage) return {};
  let raw: string | null = null;
  try {
    raw = storage.getItem(MODEL_CONFIG_STORAGE_KEY);
  } catch {
    return {};
  }
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const record = parsed as Record<string, unknown>;
    const cleaned: Partial<ModelConfig> = {};
    if (typeof record.baseUrl === "string") cleaned.baseUrl = record.baseUrl;
    if (typeof record.model === "string") cleaned.model = record.model;
    if (record.mode === "proxy" || record.mode === "direct") cleaned.mode = record.mode;
    if (typeof record.proxyUrl === "string") cleaned.proxyUrl = record.proxyUrl;
    // Scrub secrets left behind by older versions that persisted the full config.
    if ("apiKey" in record) {
      try {
        storage.setItem(MODEL_CONFIG_STORAGE_KEY, JSON.stringify(cleaned));
      } catch {
        try { storage.removeItem(MODEL_CONFIG_STORAGE_KEY); } catch { /* best effort */ }
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}