import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, cp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { generateSlideImage, resolveImageProvider } from '../skills/themed-cn-pptx/lib/ai-image.js';
import { createRecipe, recipes } from '../skills/themed-cn-pptx/recipes/recipe-collection.mjs';
import pptxgen from 'pptxgenjs';
const temp = await mkdtemp(join(tmpdir(), 'ppt-providers-'));
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const oldFetch = globalThis.fetch;
const calls = [];
let reply;
globalThis.fetch = async (url, opts = {}) => {
  calls.push({ url, ...opts, body: opts.body && JSON.parse(opts.body) });
  if (url === 'https://cdn.example/image') return new Response(Buffer.from(png, 'base64'), { headers: { 'content-type': 'image/png' } });
  return new Response(JSON.stringify(reply), { headers: { 'content-type': 'application/json' } });
};
try {
  const cases = [
    ['custom', { data: [{ b64_json: png }] }, '/images/generations'],
    ['google', { candidates: [{ content: { parts: [{ inlineData: { data: png, mimeType: 'image/png' } }] } }] }, '/models/model-test:generateContent'],
    ['bailian', { output: { choices: [{ message: { content: [{ image: 'https://cdn.example/image' }] } }] } }, '/services/aigc/multimodal-generation/generation'],
    ['minimax', { base_resp: { status_code: 0 }, data: { image_base64: [png] } }, '/image_generation'],
  ];
  for (const [provider, data, path] of cases) {
    reply = data; calls.length = 0;
    const result = await generateSlideImage({ provider, apiKey: 'test-key', baseUrl: 'https://api.example/v1/',
      model: 'model-test', prompt: 'test', size: '1536x1024', saveDir: temp });
    assert.equal(calls[0].url, `https://api.example/v1${path}`);
    assert.equal(result.model, 'model-test');
    assert.deepEqual(await readFile(result.localPath), Buffer.from(png, 'base64'));
    if (provider === 'google') assert.equal(calls[0].headers['x-goog-api-key'], 'test-key');
    if (provider === 'bailian') {
      assert.equal(calls[0].body.parameters.size, '1536*1024');
      assert.equal(calls[1].headers, undefined);
    }
    if (provider === 'custom') assert.equal(calls[0].body.size, '1536x1024');
  }
  reply = { data: [{ url: 'https://cdn.example/image' }] }; calls.length = 0;
  await generateSlideImage({ provider: 'custom', apiKey: 'test', model: 'gpt-image-2.5',
    endpoint: 'https://gateway.example/exact', prompt: 'test', saveDir: temp });
  assert.equal(calls[0].url, 'https://gateway.example/exact');
  assert.equal(calls[0].body.model, 'gpt-image-2.5');
  assert.throws(() => resolveImageProvider('typo-provider'));
  const opts = { provider: 'minimax', apiKey: 'test', prompt: 'test', saveDir: temp };
  reply = { base_resp: { status_code: 1004 } };
  await assert.rejects(generateSlideImage(opts), /API error/);
  reply = {};
  await assert.rejects(generateSlideImage(opts), /no images/);
  reply = { data: { image_base64: ['bm90IGFuIGltYWdl'] } };
  await assert.rejects(generateSlideImage(opts), /image bytes/);
  globalThis.fetch = async () => new Response('secret body', { status: 401 });
  await assert.rejects(generateSlideImage(opts), /HTTP 401$/);
  globalThis.fetch = async (url, opts) => { assert.ok(opts.signal); throw new DOMException('timed out', 'TimeoutError'); };
  await assert.rejects(generateSlideImage(opts), /timed out/);
  globalThis.fetch = oldFetch;
  const luminance = hex => {
    const rgb = hex.match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  for (const id of Object.keys(recipes)) {
    const theme = recipes[id];
    for (const field of ['ink', 'muted', 'accent']) {
      const values = [luminance(theme[field]), luminance(theme.paper)].sort((a, b) => b - a);
      assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `${id} ${field} contrast`);
    }
    const pres = new pptxgen();
    const r = createRecipe(pres, id);
    const image = join(temp, 'fixture.png'); await writeFile(image, Buffer.from(png, 'base64'));
    r.cover({ title: '示例标题', subtitle: '副标题', image });
    r.content({ title: '证据与结论', lead: '核心结论', body: '这是用于验证布局的短文。', image,
      items: [{ date: 'Q1', title: '探索', body: '完成调研' }, { date: 'Q2', title: '交付', body: '完成验证' }] });
    const out = join(temp, `${id}.pptx`); await pres.writeFile({ fileName: out });
    assert.ok((await readFile(out)).length > 1000);
  }
  // Installed skill runs independently of repository dependencies and package.json.
  const installed = join(temp, 'skill');
  await cp(new URL('../skills/themed-cn-pptx/', import.meta.url), installed, { recursive: true });
  const stdout = execFileSync(process.execPath, [join(installed, 'scripts/generate-image.mjs'), '--check', 'custom'], { cwd: temp, encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.equal(JSON.parse(stdout).networkCalled, false);
  console.log('provider protocols, downloads, failures, recipes and isolated installation PASS');
} finally {
  globalThis.fetch = oldFetch;
  await rm(temp, { recursive: true, force: true });
}
