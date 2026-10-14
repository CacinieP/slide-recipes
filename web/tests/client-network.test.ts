import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type { ClientRequest, IncomingMessage } from "node:http";
import { PassThrough } from "node:stream";
import { test } from "node:test";
import { requestLlmPlan, smartFetch } from "../src/lib/client-generator";
import { createProxyHandler, type HttpsRequester } from "../src/lib/server/proxy-handler";
import type { DeckPlan, GenerateOptions, ModelConfig } from "../src/lib/types";

const modelConfig: ModelConfig = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "test-api-key",
  model: "test-model",
};

const options: GenerateOptions = {
  topic: "Network regression checks",
  audience: "Developers",
  tone: "Clear",
  slideCount: 3,
  language: "en-US",
  paletteId: "consulting-navy",
  fontPair: "georgia-calibri",
  styleRecipe: "soft",
  includeCode: false,
  includeChart: false,
};

const plan: DeckPlan = {
  title: "Network regression checks",
  slides: [
    { type: "cover", title: "Network regression checks" },
    { type: "content", title: "Approved proxy requests", bullets: ["Use the site proxy"] },
    { type: "closing", title: "Keep requests bounded", action: "Review the results" },
  ],
};

function planResponse(modelOutput: unknown = plan): Response {
  return Response.json({
    choices: [{ message: { content: JSON.stringify(modelOutput) } }],
  });
}

for (const status of [403, 404, 405, 429, 503]) {
  test(`smartFetch preserves ${status} without contacting the target directly`, async (t) => {
    const calls: string[] = [];
    const proxyResponse = new Response("Proxy refused the request", { status });
    t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(String(input));
      assert.equal(new Headers(init?.headers).get("x-target-url"), "https://custom.example/v1/models");
      return proxyResponse;
    });

    const result = await smartFetch("https://custom.example/v1/models");

    assert.equal(result, proxyResponse);
    assert.deepEqual(calls, ["/api/proxy"]);
  });
}

test("smartFetch reports a proxy network failure without retrying or making a direct request", async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    calls.push(String(input));
    throw new TypeError("Failed to fetch");
  });

  await assert.rejects(
    smartFetch("https://custom.example/v1/models"),
    /无法连接本站模型代理/,
  );
  assert.deepEqual(calls, ["/api/proxy"]);
});

for (const status of [400, 422]) {
  test(`requestLlmPlan retries an explicit response_format rejection (${status}) once`, async (t) => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), body: JSON.parse(String(init?.body)) });
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("authorization"), `Bearer ${modelConfig.apiKey}`);
      assert.equal(headers.get("x-target-url"), `${modelConfig.baseUrl}/chat/completions`);
      return calls.length === 1
        ? Response.json({ error: "Response format is not supported.", code: "unsupported_response_format" }, { status })
        : planResponse();
    });

    const result = await requestLlmPlan(options, modelConfig);

    assert.equal(result.title, plan.title);
    assert.equal(result.slides.length, 3);
    assert.deepEqual(calls.map((call) => call.url), ["/api/proxy", "/api/proxy"]);
    assert.deepEqual(calls[0].body.response_format, { type: "json_object" });
    assert.equal(calls[0].body.stream, false);
    assert.equal(calls[0].body.max_tokens, 6000);
    assert.equal(Object.hasOwn(calls[1].body, "response_format"), false);
    assert.equal(calls[1].body.model, modelConfig.model);
    assert.equal(calls[1].body.stream, false);
    assert.equal(calls[1].body.max_tokens, 6000);
    assert.deepEqual(calls[1].body.messages, calls[0].body.messages);
  });
}

for (const [status, code, message] of [
  [400, undefined, "response_format is not supported"],
  [400, "upstream_error", "response_format is not supported"],
  [422, "unknown_code", "response_format is not supported"],
  [401, "unsupported_response_format", "Response format is not supported."],
  [403, "unsupported_response_format", "Response format is not supported."],
  [429, "unsupported_response_format", "Response format is not supported."],
  [503, "unsupported_response_format", "Response format is not supported."],
] as const) {
  test(`requestLlmPlan does not retry status ${status} and code ${String(code)}`, async (t) => {
    const calls: string[] = [];
    t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return Response.json({ error: message, code }, { status });
    });

    await assert.rejects(
      requestLlmPlan(options, modelConfig),
      new RegExp(`模型调用失败 \\(${status}\\)`),
    );
    assert.deepEqual(calls, ["/api/proxy"]);
  });
}

test("requestLlmPlan stops after one retry when the provider still rejects response_format", async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return Response.json(
      { error: "Response format is not supported.", code: "unsupported_response_format" },
      { status: 422 },
    );
  });

  await assert.rejects(requestLlmPlan(options, modelConfig), /模型调用失败 \(422\)/);
  assert.deepEqual(calls, ["/api/proxy", "/api/proxy"]);
});

test("the client retries a sanitized response_format error from the real proxy handler", async (t) => {
  const upstreamBodies: Array<Record<string, unknown>> = [];
  const proxyBodies: Array<Record<string, unknown>> = [];
  const clientCalls: string[] = [];
  const request: HttpsRequester = (_requestOptions, callback) => {
    const client = new EventEmitter() as ClientRequest;
    client.destroy = () => client;
    client.end = ((body: Buffer) => {
      upstreamBodies.push(JSON.parse(body.toString("utf8")));
      queueMicrotask(() => {
        const stream = new PassThrough();
        const upstream = stream as unknown as IncomingMessage;
        upstream.statusCode = upstreamBodies.length === 1 ? 400 : 200;
        upstream.headers = { "content-type": "application/json" };
        callback(upstream);
        stream.end(JSON.stringify(upstreamBodies.length === 1
          ? { error: { message: "response_format is not supported; credential=do-not-expose", param: "response_format", code: "unsupported_parameter" } }
          : { choices: [{ message: { content: JSON.stringify(plan) } }] }));
      });
      return client;
    }) as typeof client.end;
    return client;
  };
  const handleProxy = createProxyHandler({
    env: { NODE_ENV: "test" },
    request,
    resolveHostname: async () => [{ address: "1.1.1.1", family: 4 }],
  });
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    clientCalls.push(String(input));
    assert.equal(String(input), "/api/proxy");
    const headers = new Headers(init?.headers);
    headers.set("origin", "https://slides.example");
    headers.set("sec-fetch-site", "same-origin");
    const response = await handleProxy(new Request("https://slides.example/api/proxy", { ...init, headers }));
    proxyBodies.push(await response.clone().json());
    return response;
  });

  const result = await requestLlmPlan(options, modelConfig);

  assert.equal(result.title, plan.title);
  assert.deepEqual(clientCalls, ["/api/proxy", "/api/proxy"]);
  assert.equal(proxyBodies[0].code, "unsupported_response_format");
  assert.equal(JSON.stringify(proxyBodies).includes("do-not-expose"), false);
  assert.deepEqual(upstreamBodies[0].response_format, { type: "json_object" });
  assert.equal(Object.hasOwn(upstreamBodies[1], "response_format"), false);
});

test("empty model settings use the selected ModelBest 1B defaults with bounded output", async (t) => {
  let target = "";
  let body: Record<string, unknown> = {};
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(input), "/api/proxy");
    target = new Headers(init?.headers).get("x-target-url") || "";
    body = JSON.parse(String(init?.body));
    return planResponse({
      title: plan.title,
      page_1_title: "Network regression checks",
      page_1_body: "Use the site proxy",
      page_2_title: "Approved proxy requests",
      page_2_body: "Keep all requests bounded",
      page_3_title: "Review the results",
      page_3_body: "Run the regression checks",
    });
  });

  await requestLlmPlan(options, { baseUrl: "", model: "", apiKey: "test-api-key" });

  assert.equal(target, "https://api.modelbest.cn/v1/chat/completions");
  assert.equal(body.model, "MiniCPM-V-4.7-1B");
  assert.equal(body.stream, false);
  assert.equal(body.max_tokens, 6000);
});
