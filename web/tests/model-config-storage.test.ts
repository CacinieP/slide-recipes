import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MODEL_CONFIG_STORAGE_KEY,
  loadPersistedModelConfig,
  persistModelConfig,
  sanitizeForPersistence,
  type StorageLike,
} from "../src/lib/model-config-storage";
import type { ModelConfig } from "../src/lib/types";

function fakeStorage(initial?: string): StorageLike & { dump: Map<string, string> } {
  const dump = new Map<string, string>();
  if (initial !== undefined) dump.set(MODEL_CONFIG_STORAGE_KEY, initial);
  return {
    dump,
    getItem: (key) => dump.get(key) ?? null,
    setItem: (key, value) => { dump.set(key, value); },
    removeItem: (key) => { dump.delete(key); },
  };
}

const config: ModelConfig = {
  baseUrl: "https://api.modelbest.cn/v1",
  model: "MiniCPM-V-4.7-1B",
  apiKey: "sk-live-secret-must-not-leak",
  mode: "proxy",
  proxyUrl: "/api/proxy",
};

test("persistModelConfig never writes the API key to storage", () => {
  const storage = fakeStorage();
  persistModelConfig(config, storage);
  const written = storage.dump.get(MODEL_CONFIG_STORAGE_KEY) ?? "";
  assert.equal(written.includes("sk-live-secret-must-not-leak"), false);
  assert.equal(Object.hasOwn(JSON.parse(written), "apiKey"), false);
  const parsed = JSON.parse(written);
  assert.equal(parsed.baseUrl, config.baseUrl);
  assert.equal(parsed.model, config.model);
  assert.equal(parsed.mode, "proxy");
});

test("sanitizeForPersistence strips only the secret", () => {
  const sanitized = sanitizeForPersistence(config);
  assert.equal(Object.hasOwn(sanitized, "apiKey"), false);
  assert.equal(sanitized.baseUrl, config.baseUrl);
});

test("loadPersistedModelConfig returns non-secret settings and an empty key", () => {
  const storage = fakeStorage();
  persistModelConfig(config, storage);
  const loaded = loadPersistedModelConfig(storage);
  assert.equal(loaded.apiKey, undefined);
  assert.equal(loaded.baseUrl, config.baseUrl);
  assert.equal(loaded.model, config.model);
});

test("legacy payloads containing an API key are scrubbed on load", () => {
  const storage = fakeStorage(JSON.stringify(config)); // old versions persisted the key
  const loaded = loadPersistedModelConfig(storage);
  assert.equal(loaded.apiKey, undefined);
  assert.equal(loaded.baseUrl, config.baseUrl);
  const rewritten = storage.dump.get(MODEL_CONFIG_STORAGE_KEY) ?? "";
  assert.equal(rewritten.includes("sk-live-secret-must-not-leak"), false);
  assert.equal(Object.hasOwn(JSON.parse(rewritten), "apiKey"), false);
});

test("corrupted or unexpected payloads degrade to empty settings", () => {
  assert.deepEqual(loadPersistedModelConfig(fakeStorage("{not json")), {});
  assert.deepEqual(loadPersistedModelConfig(fakeStorage("[1,2,3]")), {});
  assert.deepEqual(loadPersistedModelConfig(fakeStorage("null")), {});
  assert.deepEqual(loadPersistedModelConfig(fakeStorage()), {});
});

test("unknown fields are not merged into the live config", () => {
  const storage = fakeStorage(JSON.stringify({ baseUrl: "https://x.example/v1", evil: "payload", mode: "hijack" }));
  const loaded = loadPersistedModelConfig(storage);
  assert.equal(loaded.baseUrl, "https://x.example/v1");
  assert.equal(Object.hasOwn(loaded, "evil"), false);
  assert.equal(loaded.mode, undefined);
});

test("storage exceptions never break the session", () => {
  const throwing: StorageLike = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
    removeItem: () => { throw new Error("blocked"); },
  };
  assert.doesNotThrow(() => persistModelConfig(config, throwing));
  assert.deepEqual(loadPersistedModelConfig(throwing), {});
  assert.deepEqual(loadPersistedModelConfig(null), {});
  assert.doesNotThrow(() => persistModelConfig(config, null));
});

test("legacy scrub falls back to removal when rewriting fails", () => {
  const storage = fakeStorage(JSON.stringify(config));
  storage.setItem = () => { throw new Error("quota"); };
  const loaded = loadPersistedModelConfig(storage);
  assert.equal(loaded.baseUrl, config.baseUrl);
  assert.equal(storage.dump.has(MODEL_CONFIG_STORAGE_KEY), false);
});