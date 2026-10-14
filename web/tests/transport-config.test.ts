import assert from 'node:assert/strict';
import { test } from 'node:test';
import { smartFetch } from '../src/lib/client-generator';
import { configuredBaseUrls, validateTarget } from '../src/lib/server/proxy-policy';

test('explicit direct mode sends one request without proxy headers or retry', async t => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(String(input));
    assert.equal(new Headers(init?.headers).has('x-target-url'), false);
    assert.equal(init?.redirect, 'error');
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(smartFetch('https://api.openai.com/v1/models', {}, { mode: 'direct' }), /可能是网络、端点或供应商 CORS/);
  assert.deepEqual(calls, ['https://api.openai.com/v1/models']);
});
test('explicit external proxy uses the configured transport for model detection', async t => {
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(input), 'https://proxy.example/api/proxy');
    assert.equal(new Headers(init?.headers).get('x-target-url'), 'https://api.openai.com/v1/models');
    return Response.json({data: []});
  });
  await smartFetch('https://api.openai.com/v1/models', {}, { mode: 'proxy', proxyUrl: 'https://proxy.example/api/proxy' });
});
test('deployment allowlist expands only exact approved HTTPS API paths', () => {
  const bases = configuredBaseUrls({ NODE_ENV: "test", MODEL_PROXY_ALLOWED_BASE_URLS: 'https://models.example.com/v1' });
  assert.equal(validateTarget('https://models.example.com/v1/models', 'GET', bases).hostname, 'models.example.com');
  for (const target of ['https://models.example.com/admin', 'https://models.example.com/v1/chat/completions?x=1', 'https://other.example.com/v1/models']) {
    assert.throws(() => validateTarget(target, 'GET', bases));
  }
  for (const base of ['http://models.example.com/v1', 'https://localhost/v1', 'https://127.0.0.1/v1', 'https://models.internal/v1', 'https://user:pass@models.example.com/v1']) {
    assert.throws(() => configuredBaseUrls({ NODE_ENV: "test", MODEL_PROXY_ALLOWED_BASE_URLS: base }));
  }
});
