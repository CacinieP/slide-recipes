#!/usr/bin/env node
// Documentation contracts and intent fixtures, NOT a model invocation or visual QA.
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
const root = fileURLToPath(new URL('..', import.meta.url));
const skill = resolve(root, 'skills/slide-recipes');
const names = ['SKILL.md', 'SKILL.cn.md'];
const docs = await Promise.all(names.map(n => readFile(resolve(skill, n), 'utf8')));
const meta = docs.map((s, i) => {
  const m = s.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, `${names[i]} frontmatter`);
  const parsed = parseDocument(m[1]);
  assert.equal(parsed.errors.length, 0);
  const data = parsed.toJS();
  assert.equal(data.name, 'slide-recipes');
  assert.deepEqual(Object.keys(data).sort(), ['description', 'name']);
  assert.ok([...data.description].length <= 200);
  assert.ok(s.trimEnd().split('\n').length < 500);
  console.log(`${names[i]}: ${s.trimEnd().split('\n').length} lines; description ${[...data.description].length} characters`);
  return data;
});
assert.equal(meta[0].name, meta[1].name);
for (const s of docs) {
  assert.equal((s.match(/^## \d\./gm) || []).length, 6);
  for (const token of ['10 × 5.625', '13.333 × 7.5', '16–20pt', 'DeckSchema', 'render-qa.mjs', 'pptx-editable-check.py', 'color-qa.mjs', 'cjk-overflow-check.mjs', 'generate-image.mjs']) assert.ok(s.includes(token), token);
}
const links = s => [...s.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1]).filter(x => !/^(https?:|mailto:|#)/.test(x));
assert.deepEqual(links(docs[0]).filter(x => x.startsWith('references/')).sort(), links(docs[1]).filter(x => x.startsWith('references/')).sort());
const references = ['aesthetic-rules.md', 'design-playbook.md', 'production-reference.md', 'image-constraints.md', 'layout-slots.md', 'recipe-catalog.md', 'commercial-recipes.md'];
let checked = 0;
for (const file of [...names.map(x => resolve(skill, x)), ...references.map(x => resolve(skill, 'references', x))]) {
  const text = await readFile(file, 'utf8');
  for (const link of links(text)) {
    await access(resolve(dirname(file), decodeURIComponent(link.split('#')[0])));
    checked++;
  }
}
for (const readme of ['README.md', 'README.zh-CN.md']) {
  const text = await readFile(resolve(root, readme), 'utf8');
  // Check the new upgrade section only: historical remote/demo links are unchanged.
  const section = text.split(/^## /m)[1];
  for (const link of links(section)) { await access(resolve(root, link)); checked++; }
}
console.log(`Local documentation links: ${checked} checked`);

// Six curated intent fixtures. Assertions ensure the fixture contract, not model routing.
const fixtures = [
  {id:'P1', language:'zh', text:'把这份经营复盘文稿做成8页可编辑PPT，先看关键证据。', presentation:true, action:'create', excluded:false, expected:true, reason:'从文稿制作演示文稿'},
  {id:'P2', language:'en', text:'Revise slides 3 and 6 in this editable PPTX; preserve all other pages.', presentation:true, action:'revise', excluded:false, expected:true, reason:'局部修改现有PPTX'},
  {id:'P3', language:'mixed', text:'请给中文 PowerPoint 做 render QA，检查溢出和二维码。', presentation:true, action:'qa', excluded:false, expected:true, reason:'演示文稿质量检查'},
  {id:'N1', language:'zh', text:'做一张带二维码的活动海报，不要演示文稿。', presentation:false, action:'create', excluded:true, expected:false, reason:'海报不是deck'},
  {id:'N2', language:'en', text:'Edit this PDF contract only; do not create a presentation.', presentation:false, action:'revise', excluded:true, expected:false, reason:'仅PDF编辑'},
  {id:'N3', language:'en', text:'Explain how a CSS slide transition works on a website.', presentation:false, action:'explain', excluded:false, expected:false, reason:'slide关键词不等于演示意图'},
];
assert.equal(fixtures.filter(f => f.expected).length, 3);
assert.equal(fixtures.filter(f => !f.expected).length, 3);
for (const f of fixtures) {
  const contractDecision = f.presentation && ['create', 'revise', 'qa'].includes(f.action) && !f.excluded;
  assert.equal(contractDecision, f.expected, f.id);
  console.log(`${f.id} expected=${f.expected ? 'trigger' : 'do not trigger'} | ${f.text} | ${f.reason}`);
}
const playbook = await readFile(resolve(skill, 'references/design-playbook.md'), 'utf8');
assert.equal((playbook.match(/^## Case /gm) || []).length, 3);
assert.ok(playbook.includes('not machine schema'));
assert.ok(playbook.includes('Workflow rehearsal'));
console.log('PASS documentation contracts and 6 curated intent fixtures; no LLM trigger test or visual acceptance claimed.');
