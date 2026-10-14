import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type { ClientRequest, IncomingMessage } from "node:http";
import type { LookupAddress } from "node:dns";
import { PassThrough } from "node:stream";
import { test } from "node:test";
import type { RequestOptions } from "node:https";
import { createProxyHandler, type ProxyDependencies, type HttpsRequester } from "../src/lib/server/proxy-handler";
import { createRateLimiter, RATE_LIMIT_SCRIPT } from "../src/lib/server/proxy-limiter";
import { isPublicAddress, MAX_REQUEST_BYTES, MAX_RESPONSE_BYTES, PROXY_BASE_URLS, validateTarget } from "../src/lib/server/proxy-policy";

const ORIGIN = "https://slides.example";
const PUBLIC: LookupAddress = { address: "93.184.216.34", family: 4 };
const prodEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "production", VERCEL: "1",
  UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "test-token-only",
};

function input(method = "GET", extra: Record<string, string> = {}, body?: string | ReadableStream<Uint8Array>, url = `${ORIGIN}/api/proxy`): Request {
  return new Request(url, {
    method,
    headers: {
      authorization: "Bearer sk-test-only",
      "x-target-url": `https://api.openai.com/v1/${method === "POST" ? "chat/completions" : "models"}`,
      "sec-fetch-site": "same-origin",
      ...(method === "POST" ? { "content-type": "application/json", origin: ORIGIN } : {}),
      ...extra,
    },
    ...(method === "POST" ? { body: body ?? JSON.stringify({ model: "test-model", messages: [{ role: "user", content: "test" }] }), duplex: "half" } : {}),
  } as RequestInit);
}

interface MockOptions {
  status?: number;
  headers?: Record<string, string>;
  chunks?: Buffer[];
  hang?: boolean;
  requestError?: boolean;
}

function transport(options: MockOptions = {}) {
  const calls: { options: RequestOptions; body?: Buffer; destroyed: boolean; response?: PassThrough }[] = [];
  const request: HttpsRequester = (requestOptions, callback) => {
    const captured = { options: requestOptions, destroyed: false } as typeof calls[number];
    calls.push(captured);
    const client = new EventEmitter();
    Object.assign(client, {
      destroy() { captured.destroyed = true; return client; },
      end(body?: Buffer) {
        captured.body = body;
        queueMicrotask(() => {
          if (options.requestError) { client.emit("error", new Error("secret exception with test-token-only")); return; }
          if (options.hang || captured.destroyed) return;
          const response = Object.assign(new PassThrough(), {
            statusCode: options.status ?? 200,
            headers: { "content-type": "application/json", ...options.headers },
          });
          captured.response = response;
          callback(response as unknown as IncomingMessage);
          for (const chunk of options.chunks ?? [Buffer.from('{"data":[{"id":"test-model"}]}')]) {
            if (response.destroyed) break;
            response.write(chunk);
          }
          if (!response.destroyed) response.end();
        });
        return client;
      },
    });
    return client as unknown as ClientRequest;
  };
  return { calls, request };
}

function fixture(options: MockOptions = {}, deps: ProxyDependencies = {}) {
  const mock = transport(options);
  let dnsCalls = 0;
  const handle = createProxyHandler({
    env: { NODE_ENV: "test" }, request: mock.request,
    resolveHostname: async () => { dnsCalls++; return [PUBLIC]; },
    ...deps,
  });
  return { handle, calls: mock.calls, dnsCalls: () => dnsCalls };
}

const redisAllowed = (async () => Response.json({ result: [1, 0] })) as typeof fetch;

test("only the seven exact providers and model/chat endpoint pairs are approved", () => {
  for (const base of PROXY_BASE_URLS) {
    assert.equal(validateTarget(`${base}/models`, "GET").href, `${base}/models`);
    assert.equal(validateTarget(`${base}/chat/completions`, "POST").href, `${base}/chat/completions`);
    assert.throws(() => validateTarget(`${base}/chat/completions`, "GET"));
    assert.throws(() => validateTarget(`${base}/models`, "POST"));
  }
  assert.equal(validateTarget("https://api.openai.com:443/v1/models", "GET").port, "");
});

for (const target of [
  "http://api.openai.com/v1/models", "https://api.openai.com:444/v1/models",
  "https://api.openai.com@127.0.0.1/v1/models", "https://user:pass@api.openai.com/v1/models",
  "https://api.openai.com.attacker.test/v1/models", "https://127.0.0.1/v1/models",
  "https://[::1]/v1/models", "https://2130706433/v1/models", "https://0x7f000001/v1/models",
  "https://api.openai.com/v1/models?url=http://169.254.169.254", "https://api.openai.com/v1/models?",
  "https://api.openai.com/v1/models#fragment", "https://api.openai.com/v1/models#",
  "https://api.openai.com/v1/models/", "https://api.openai.com/v1/%6dodels",
  "https://api.openai.com/v1/images/generations", "https://api.openai.com/v1/files",
  "https://api.openai.com\\attacker.test/v1/models", "file:///etc/passwd", "not a URL",
]) {
  test(`reject unapproved target: ${target}`, async () => {
    const f = fixture();
    const response = await f.handle(input("GET", { "x-target-url": target }));
    assert.ok(response.status === 400 || response.status === 403);
    assert.equal(f.dnsCalls(), 0);
    assert.equal(f.calls.length, 0);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
}

test("legacy query targets are rejected before DNS", async () => {
  const f = fixture();
  assert.equal((await f.handle(input("GET", {}, undefined, `${ORIGIN}/api/proxy?url=https://api.openai.com/v1/models`))).status, 400);
  assert.equal(f.dnsCalls(), 0);
});

test("cross-site origin/fetch metadata and missing Bearer keys are rejected", async () => {
  for (const headers of [{ origin: "https://attacker.test" }, { "sec-fetch-site": "cross-site" }, { authorization: "" }, { authorization: "Bearer " }, { authorization: "Basic token" }] as Record<string, string>[]) {
    const f = fixture();
    const result = await f.handle(input("GET", headers));
    assert.ok([401, 403].includes(result.status));
    assert.equal(f.calls.length, 0);
    assert.equal(f.dnsCalls(), 0);
  }
});

test("private, reserved, mapped and transition IP addresses fail closed", () => {
  for (const address of [
    "0.0.0.0", "0.1.2.3", "10.0.0.1", "127.0.0.1", "169.254.169.254",
    "172.16.1.2", "192.168.1.2", "100.64.0.1", "198.18.0.1", "192.0.2.1",
    "198.51.100.1", "203.0.113.1", "224.0.0.1", "255.255.255.255", "not-an-IP",
    "::", "::1", "fc00::1", "fe80::1", "ff02::1", "2001:db8::1",
    "::ffff:127.0.0.1", "::ffff:8.8.8.8", "2002:7f00:1::", "2001::1",
  ]) assert.equal(isPublicAddress(address), false, address);
  for (const address of [PUBLIC.address, "8.8.8.8", "2606:4700:4700::1111"]) assert.equal(isPublicAddress(address), true, address);
});

for (const addresses of [
  [], [{ address: "127.0.0.1", family: 4 }], [PUBLIC, { address: "10.0.0.1", family: 4 }],
  [{ address: "::ffff:127.0.0.1", family: 6 }], [{ ...PUBLIC, family: 6 }],
]) {
  test(`reject unsafe/mixed/invalid DNS set: ${JSON.stringify(addresses)}`, async () => {
    const f = fixture({}, { resolveHostname: async () => addresses });
    const response = await f.handle(input());
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, "unsafe_upstream_address");
    assert.equal(f.calls.length, 0);
  });
}

test("GET uses pinned public DNS, original TLS hostname and certificate validation", async () => {
  let dnsCount = 0;
  const f = fixture({}, { resolveHostname: async () => ++dnsCount === 1 ? [PUBLIC] : [{ address: "127.0.0.1", family: 4 }] });
  const response = await f.handle(input());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: [{ id: "test-model" }] });
  const options = f.calls[0].options;
  assert.equal(options.hostname, "api.openai.com");
  assert.equal(options.servername, "api.openai.com");
  assert.equal(options.rejectUnauthorized, true);
  assert.equal(options.agent, false);
  assert.equal(options.method, "GET");
  assert.equal(options.path, "/v1/models");
  const lookup = options.lookup!;
  for (let i = 0; i < 2; i++) {
    await new Promise<void>((resolve, reject) => lookup("api.openai.com", {}, (error, address, family) => {
      if (error) reject(error);
      else { assert.equal(address, PUBLIC.address); assert.equal(family, 4); resolve(); }
    }));
  }
  await new Promise<void>((resolve, reject) => lookup("api.openai.com", { all: true }, (error, address) => {
    if (error) reject(error); else { assert.deepEqual(address, [PUBLIC]); resolve(); }
  }));
  assert.equal(dnsCount, 1, "a second network lookup could permit DNS rebinding");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("POST sends bounded JSON and only the intended authorization header", async () => {
  const reply = { choices: [{ message: { content: '{"slides":[]}' } }] };
  const f = fixture({ chunks: [Buffer.from(JSON.stringify(reply))] });
  const body = JSON.stringify({ model: "test-model", messages: [{ role: "user", content: "test" }], stream: false });
  const response = await f.handle(input("POST", { cookie: "private-cookie", "x-extra": "do-not-forward" }, body));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), reply);
  assert.equal(f.calls[0].body?.toString(), body);
  assert.equal(f.calls[0].options.method, "POST");
  assert.equal(f.calls[0].options.path, "/v1/chat/completions");
  const headers = f.calls[0].options.headers as Record<string, unknown>;
  assert.equal(headers.Authorization, "Bearer sk-test-only");
  assert.equal(headers.Cookie, undefined);
  assert.equal(headers["x-extra"], undefined);
});

test("redirects are rejected without a second request or exposing Location", async () => {
  const f = fixture({ status: 302, headers: { location: "http://169.254.169.254/secret" } });
  const response = await f.handle(input());
  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, "upstream_redirect");
  assert.equal(response.headers.get("location"), null);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].destroyed, true);
});

test("non-JSON, compressed and invalid JSON responses are rejected", async () => {
  for (const options of [
    { headers: { "content-type": "text/html" }, chunks: [Buffer.from("<html>bad</html>")] },
    { headers: { "content-encoding": "gzip" } },
    { chunks: [Buffer.from("not json")] },
  ] as MockOptions[]) {
    const f = fixture(options);
    const response = await f.handle(input());
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, "invalid_upstream_response");
  }
});

test("upstream errors do not expose API keys, internal URLs or thrown exceptions", async () => {
  for (const options of [
    { status: 401, chunks: [Buffer.from('{"error":"sk-test-only https://internal.example/secret"}')] },
    { requestError: true },
  ]) {
    const f = fixture(options);
    const response = await f.handle(input());
    const text = await response.text();
    assert.ok(!text.includes("sk-test-only") && !text.includes("internal.example") && !text.includes("test-token-only"));
  }
});

test("both declared and streamed request-size limits prevent egress", async () => {
  for (const headers of [{}, { "content-length": String(MAX_REQUEST_BYTES + 1) }] as Record<string, string>[]) {
    const f = fixture();
    const response = await f.handle(input("POST", headers, JSON.stringify({ text: "x".repeat(MAX_REQUEST_BYTES) })));
    assert.equal(response.status, 413);
    assert.equal(f.calls.length, 0);
    assert.equal(f.dnsCalls(), 0);
  }
});

test("invalid JSON/object and streaming bodies prevent egress", async () => {
  for (const body of ["not json", "[]", "null", '{"stream":true}', '{"stream":"true"}']) {
    const f = fixture();
    assert.equal((await f.handle(input("POST", {}, body))).status, 400);
    assert.equal(f.calls.length, 0);
  }
  const f = fixture();
  assert.equal((await f.handle(input("POST", { "content-type": "text/plain" }, "{}"))).status, 415);
  assert.equal(f.calls.length, 0);
});

test("declared and streamed response limits destroy upstream connections", async () => {
  for (const options of [
    { headers: { "content-length": String(MAX_RESPONSE_BYTES + 1) } },
    { chunks: [Buffer.alloc(MAX_RESPONSE_BYTES), Buffer.from("extra")] },
  ]) {
    const f = fixture(options);
    const response = await f.handle(input());
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, "response_too_large");
    assert.equal(f.calls[0].destroyed, true);
  }
});

test("total timeout includes DNS, with no late upstream request", async () => {
  let finishDns: (addresses: LookupAddress[]) => void = () => {};
  const f = fixture({}, { timeoutMs: 20, resolveHostname: () => new Promise((resolve) => { finishDns = resolve; }) });
  const response = await f.handle(input());
  assert.equal(response.status, 504);
  finishDns([PUBLIC]);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(f.calls.length, 0);
});

test("total timeout cancels stalled uploads and upstream connections", async () => {
  let canceled = false;
  const stream = new ReadableStream<Uint8Array>({ cancel() { canceled = true; } });
  const upload = fixture({}, { timeoutMs: 20 });
  assert.equal((await upload.handle(input("POST", {}, stream))).status, 504);
  assert.equal(canceled, true);
  assert.equal(upload.calls.length, 0);
  const upstream = fixture({ hang: true }, { timeoutMs: 20 });
  assert.equal((await upstream.handle(input())).status, 504);
  assert.equal(upstream.calls[0].destroyed, true);
});

test("production without a configured shared limiter fails closed before DNS", async () => {
  for (const env of [{ NODE_ENV: "production" }, { NODE_ENV: "test", VERCEL: "1" }] as NodeJS.ProcessEnv[]) {
    const f = fixture({}, { env });
    assert.equal((await f.handle(input())).status, 503);
    assert.equal(f.calls.length, 0);
    assert.equal(f.dnsCalls(), 0);
  }
});

for (const url of [
  "http://test-redis.upstash.io", "https://test-redis.upstash.io.attacker.test",
  "https://127.0.0.1", "https://user:pass@test-redis.upstash.io",
  "https://test-redis.upstash.io:444", "https://test-redis.upstash.io/path",
  "https://test-redis.upstash.io?token=value", "https://test-redis.upstash.io#fragment",
]) {
  test(`unsafe limiter configuration fails closed: ${url}`, async () => {
    let fetched = false;
    const f = fixture({}, { env: { ...prodEnv, UPSTASH_REDIS_REST_URL: url }, fetch: (async () => { fetched = true; return Response.json({ result: [1, 0] }); }) as typeof fetch });
    assert.equal((await f.handle(input())).status, 503);
    assert.equal(fetched, false);
    assert.equal(f.calls.length, 0);
  });
}

test("failed/malformed Redis responses never fall back to a local allowance", async () => {
  for (const fetcher of [
    async () => { throw new Error("test-token-only upstream address"); },
    async () => new Response("service unavailable", { status: 503 }),
    async () => Response.json({ error: "test-token-only" }),
    async () => Response.json({ result: "OK" }),
    async () => Response.json({ result: [1, -1] }),
    async () => Response.json({ result: [1, 61] }),
  ]) {
    const f = fixture({}, { env: prodEnv, fetch: fetcher as typeof fetch });
    const response = await f.handle(input());
    assert.equal(response.status, 503);
    assert.equal(f.calls.length, 0);
    assert.equal(f.dnsCalls(), 0);
    assert.ok(!(await response.text()).includes("test-token-only"));
  }
});

test("shared limiter uses one atomic global/client command and sanitized keys", async () => {
  const bodies: unknown[][] = [];
  const f = fixture({}, {
    env: prodEnv,
    fetch: (async (url, options) => {
      assert.equal(url, "https://test-redis.upstash.io/");
      assert.equal(options?.redirect, "error");
      const command = JSON.parse(String(options?.body)) as unknown[];
      bodies.push(command);
      return Response.json({ result: [1, 0] });
    }) as typeof fetch,
  });
  assert.equal((await f.handle(input("GET", { "x-vercel-forwarded-for": "198.51.100.5" }))).status, 200);
  const [command] = bodies;
  assert.deepEqual(command.slice(0, 3), ["EVAL", RATE_LIMIT_SCRIPT, 2]);
  assert.equal(command[3], "slide-recipes:proxy:{limit}:global");
  assert.match(String(command[4]), /^slide-recipes:proxy:\{limit\}:client:[a-f0-9]{64}$/);
  assert.deepEqual(command.slice(5), [30, 6, 60]);
  assert.ok(!JSON.stringify(command).includes("198.51.100.5") && !JSON.stringify(command).includes("sk-test-only"));
});

test("Redis rejection produces 429/Retry-After without DNS or upstream traffic", async () => {
  const f = fixture({}, { env: prodEnv, fetch: (async () => Response.json({ result: [0, 42] })) as typeof fetch });
  const response = await f.handle(input());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "42");
  assert.equal(f.dnsCalls(), 0);
  assert.equal(f.calls.length, 0);
});

test("forwarded client IPs only influence shared buckets on Vercel", async () => {
  async function key(env: NodeJS.ProcessEnv, ip: string): Promise<string> {
    let clientKey = "";
    const limiter = createRateLimiter({ env, now: () => 0, fetch: (async (_url, options) => {
      clientKey = JSON.parse(String(options?.body))[4];
      return Response.json({ result: [1, 0] });
    }) as typeof fetch });
    await limiter(input("GET", { "x-vercel-forwarded-for": ip, "x-forwarded-for": "198.51.100.99" }), new AbortController().signal);
    return clientKey;
  }
  const outsideVercel = { ...prodEnv, VERCEL: "" };
  assert.equal(await key(outsideVercel, "198.51.100.1"), await key(outsideVercel, "198.51.100.2"));
  assert.notEqual(await key(prodEnv, "198.51.100.1"), await key(prodEnv, "198.51.100.2"));
  assert.equal(await key(prodEnv, "bad-value"), await key(prodEnv, "198.51.100.1, 198.51.100.2"));
});

test("local development rate limit cannot be bypassed by fake keys or IP headers and resets", async () => {
  let now = 1000;
  const f = fixture({}, { now: () => now });
  for (let i = 0; i < 6; i++) assert.equal((await f.handle(input("GET", { authorization: `Bearer fake-${i}`, "x-forwarded-for": `198.51.100.${i}` }))).status, 200);
  assert.equal((await f.handle(input())).status, 429);
  assert.equal(f.calls.length, 6);
  now += 60_000;
  assert.equal((await f.handle(input())).status, 200);
});

test("configured production limiter permits both supported methods", async () => {
  const f = fixture({}, { env: prodEnv, fetch: redisAllowed });
  assert.equal((await f.handle(input())).status, 200);
  assert.equal((await f.handle(input("POST"))).status, 200);
});

test("only explicit response_format unsupported errors get the safe compatibility code", async () => {
  const body = JSON.stringify({ model: "test-model", response_format: { type: "json_object" }, messages: [] });
  for (const status of [400, 422]) {
    for (const error of [
      { code: "unsupported_parameter", param: "response_format", message: "sensitive provider details" },
      { message: "response_format is not supported. test-token-only" },
      { message: "This model does not support the response_format parameter" },
      { message: "Unsupported parameter: 'response_format'" },
    ]) {
      const f = fixture({ status, chunks: [Buffer.from(JSON.stringify({ error }))] });
      const response = await f.handle(input("POST", {}, body));
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), { code: "unsupported_response_format", error: "The model service does not support response_format." });
    }
  }
  for (const [status, message] of [
    [400, "response_format has an invalid schema"], [400, "json_object is not supported"],
    [401, "response_format is not supported"], [403, "response_format is not supported"],
    [429, "response_format is not supported"], [503, "response_format is not supported"],
  ] as [number, string][]) {
    const f = fixture({ status, chunks: [Buffer.from(JSON.stringify({ error: { message } }))] });
    const response = await f.handle(input("POST", {}, body));
    assert.equal((await response.json()).code, "upstream_error");
  }
});
