import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

interface ConfigInspection {
  baseUrl?: string;
  chatCompletionsUrl?: string;
  model?: string;
  stream?: boolean;
  maxTokens?: number;
  fixtureKeyMatches?: boolean;
  frozen?: boolean;
  networkAttempts?: number;
  error?: string;
}

// Isolate the server-only import and supply only test fixture environment values.
// Do not inherit credentials or load the developer's .env.local.
function inspectServerConfig(fixtureEnv: Record<string, string> = {}): ConfigInspection {
  const moduleUrl = pathToFileURL(resolve("src/lib/server/model-config.ts")).href;
  const script = `
    import { getWebsiteModelConfig } from ${JSON.stringify(moduleUrl)};
    let networkAttempts = 0;
    globalThis.fetch = () => { networkAttempts++; throw new Error("Unexpected network request"); };
    try {
      const config = getWebsiteModelConfig();
      console.log(JSON.stringify({
        baseUrl: config.baseUrl,
        chatCompletionsUrl: config.chatCompletionsUrl,
        model: config.model,
        stream: config.stream,
        maxTokens: config.maxTokens,
        fixtureKeyMatches: config.apiKey === "fixture-model-key",
        frozen: Object.isFrozen(config),
        networkAttempts,
      }));
    } catch (error) {
      console.log(JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error", networkAttempts }));
    }
  `;
  const result = execFileSync(process.execPath, [
    "--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", script,
  ], {
    encoding: "utf8",
    env: { PATH: process.env.PATH || "", NODE_ENV: "test", ...fixtureEnv },
  });
  return JSON.parse(result);
}

test("server model configuration fixes the selected endpoint, model, and output bound", () => {
  const result = inspectServerConfig({ MODELBEST_API_KEY: "fixture-model-key" });

  assert.deepEqual(result, {
    baseUrl: "https://api.modelbest.cn/v1",
    chatCompletionsUrl: "https://api.modelbest.cn/v1/chat/completions",
    model: "MiniCPM-V-4.7-1B",
    stream: false,
    maxTokens: 6000,
    fixtureKeyMatches: true,
    frozen: true,
    networkAttempts: 0,
  });
});

test("client-like model and endpoint environment values cannot override the fixed server config", () => {
  const result = inspectServerConfig({
    MODELBEST_API_KEY: "fixture-model-key",
    MODELBEST_BASE_URL: "http://127.0.0.1/private",
    MODELBEST_MODEL: "unapproved-model",
    OPENAI_BASE_URL: "https://unapproved.example/v1",
    OPENAI_MODEL: "unapproved-model",
    NEXT_PUBLIC_MODEL_BASE_URL: "https://unapproved.example/v1",
    NEXT_PUBLIC_MODEL_NAME: "unapproved-model",
  });

  assert.equal(result.baseUrl, "https://api.modelbest.cn/v1");
  assert.equal(result.model, "MiniCPM-V-4.7-1B");
  assert.equal(result.fixtureKeyMatches, true);
  assert.equal(result.networkAttempts, 0);
});

for (const fixtureEnv of [
  {},
  { MODELBEST_API_KEY: "   " },
  { MODELBEST_API_KEY: "fixture\ninvalid" },
  { OPENAI_API_KEY: "fixture-model-key" },
] as Array<Record<string, string>>) {
  test(`missing or invalid site credentials return a generic error (fixture ${JSON.stringify(Object.keys(fixtureEnv))})`, () => {
    assert.deepEqual(inspectServerConfig(fixtureEnv), {
      error: "The site model is unavailable.",
      networkAttempts: 0,
    });
  });
}
