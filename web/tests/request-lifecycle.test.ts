import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { smartFetch, DEFAULT_REQUEST_TIMEOUT_MS } from "../src/lib/client-generator";

/** A fetch mock that stays pending until the composed signal aborts. */
function hangingFetch(t: TestContext) {
  const seen: Array<AbortSignal | undefined> = [];
  t.mock.method(globalThis, "fetch", (_input: RequestInfo | URL, init?: RequestInit) => {
    seen.push(init?.signal ?? undefined);
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      const abort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
      if (signal?.aborted) { abort(); return; }
      signal?.addEventListener("abort", abort, { once: true });
    });
  });
  return seen;
}

test("smartFetch passes a signal and honors caller cancellation", async (t) => {
  const seen = hangingFetch(t);
  const controller = new AbortController();
  const pending = smartFetch("https://custom.example/v1/models", {}, { signal: controller.signal });
  assert.equal(seen.length, 1);
  assert.ok(seen[0], "fetch must receive an AbortSignal");
  controller.abort();
  await assert.rejects(pending, /请求已取消/);
});

test("an already-aborted caller signal cancels before the request resolves", async (t) => {
  hangingFetch(t);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    smartFetch("https://custom.example/v1/models", {}, { signal: controller.signal }),
    /请求已取消/,
  );
});

test("smartFetch times out a hung proxy with a distinct message", async (t) => {
  hangingFetch(t);
  await assert.rejects(
    smartFetch("https://custom.example/v1/models", {}, { timeoutMs: 25 }),
    /代理响应超时/,
  );
});

test("smartFetch times out a hung direct connection with a distinct message", async (t) => {
  hangingFetch(t);
  await assert.rejects(
    smartFetch("https://custom.example/v1/models", {}, { mode: "direct", timeoutMs: 25 }),
    /直连超时/,
  );
});

test("timeout is bounded by default and can be disabled explicitly", async (t) => {
  assert.equal(DEFAULT_REQUEST_TIMEOUT_MS, 120_000);
  const seen = hangingFetch(t);
  const controller = new AbortController();
  const pending = smartFetch("https://custom.example/v1/models", {}, { timeoutMs: 0, signal: controller.signal });
  // With timeout disabled only the caller can cancel; prove it still works.
  controller.abort();
  await assert.rejects(pending, /请求已取消/);
  assert.ok(seen[0]);
});

test("a fast successful response is returned untouched with a signal present", async (t) => {
  const ok = Response.json({ ok: true });
  t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    assert.ok(init?.signal, "signal should be attached even for fast requests");
    return ok;
  });
  const result = await smartFetch("https://custom.example/v1/models", {}, { timeoutMs: 1000 });
  assert.equal(result, ok);
});