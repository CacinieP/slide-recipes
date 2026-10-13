import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateDeckSchema, validateSlide, SLIDE_TYPES, SUPPORTED_RECIPE_IDS } from '../skills/slide-recipes/lib/deck-schema.js';
import { renderDeckToPptx } from '../skills/slide-recipes/lib/deck-renderer.js';
import { readZip } from '../skills/slide-recipes/lib/zip-reader.js';
import { parseSlide } from '../skills/slide-recipes/lib/pptx-shapes.js';

console.log('Testing deck-schema.js & deck-renderer.js...');

// 1. 基本常数检查
assert.equal(SLIDE_TYPES.length, 19);
assert.ok(SLIDE_TYPES.includes('kpiDashboard'));
assert.ok(SLIDE_TYPES.includes('funnel'));
assert.ok(SLIDE_TYPES.includes('gantt'));
assert.ok(SLIDE_TYPES.includes('swot'));
assert.ok(SUPPORTED_RECIPE_IDS.includes('investor-signal'));

// 2. 单 slide 校验成功案例
const validKpi = {
  type: 'kpiDashboard',
  title: '关键业务指标',
  note: '口径: 2026 Q1',
  items: [
    { label: 'ARR', value: '¥12.5M', change: '+45%', context: '同比增长' },
    { label: 'NDR', value: '118%', change: '+5%', context: '净留存率' },
    { label: '毛利率', value: '78%', change: '+2%', context: '健康度高' },
  ],
};
assert.deepEqual(validateSlide(validKpi, 0), []);

// 3. 校验失败拦截案例
const invalidFunnel = {
  type: 'funnel',
  title: '漏斗',
  note: '', // 缺少 note
  stages: [
    { label: '访客', value: 100 },
    { label: '注册', value: 120 }, // 违反单调非递增
    { label: '付费', value: 10 },
  ],
};
const funnelErrors = validateSlide(invalidFunnel, 1);
assert.ok(funnelErrors.length >= 2);
assert.ok(funnelErrors.some(e => e.includes('单调非递增')));
assert.ok(funnelErrors.some(e => e.includes('note')));

// 4. 整份 Deck 校验
const sampleDeck = {
  version: '2.0.0',
  meta: { title: '商业方案演示', topic: 'AI PPT', language: 'zh-CN' },
  design: { recipeId: 'editorial-proposal', paletteId: 'cobalt-white' },
  slides: [
    { type: 'cover', title: '全链路商业方案', subtitle: '让汇报更严谨', kicker: 'PROPOSAL' },
    {
      type: 'agenda',
      title: '汇报议程',
      items: [
        { title: '现状与目标', body: '核心挑战与目标对齐' },
        { title: '方案与路径', body: '关键举措与里程碑' },
        { title: '投入与预期', body: '资源预算与商业回报' },
      ],
    },
    {
      type: 'executiveSummary',
      title: '执行摘要',
      decision: '优先加大对核心企业客户的交付投入',
      evidence: ['大客户贡献 70% ARR', '交付周期从 4 周缩短至 1 周'],
      nextStep: '下周召开资源评审会',
    },
    validKpi,
    {
      type: 'funnel',
      title: '客户转化漏斗',
      note: '统计范围: 注册 30 天队列',
      stages: [
        { label: '注册', value: 1000 },
        { label: '激活', value: 500 },
        { label: '付费', value: 150 },
      ],
    },
    {
      type: 'gantt',
      title: '交付排期计划',
      note: '时间单位: 周',
      periods: ['W1', 'W2', 'W3', 'W4', 'W5'],
      tasks: [
        { label: '需求分析', start: 0, end: 1 },
        { label: '原型研发', start: 1, end: 3 },
        { label: '联调上线', start: 3, end: 4 },
      ],
    },
    {
      type: 'processFlow',
      title: '业务实施流程',
      steps: [
        { title: '业务输入', body: '收集需求与数据源' },
        { title: '模型推理', body: '生成标准化大纲' },
        { title: '矢量渲染', body: '生成可编辑 PPTX' },
      ],
    },
    {
      type: 'quadrant',
      title: '优先级矩阵',
      xLabel: '技术可行性',
      yLabel: '商业价值',
      note: '专家评分加权',
      points: [
        { label: 'AI 生成引擎', x: 0.8, y: 0.9 },
        { label: 'Web 实时预览', x: 0.7, y: 0.6 },
        { label: '第三方集成', x: 0.3, y: 0.4 },
      ],
    },
    {
      type: 'swot',
      title: '态势分析',
      strengths: ['中文排版精度高', '原生图表与矢量几何'],
      weaknesses: ['依赖本地字体支持'],
      opportunities: ['企业对高质量 PPT 需求强劲'],
      threats: ['低代码平台竞争'],
    },
    {
      type: 'comparison',
      title: '方案对比选型',
      columns: ['传统模板方案', 'Slide Recipes 方案'],
      rows: [
        { label: '可编辑性', values: ['纯图片不可改', '原生文字与矢量图表'] },
        { label: '中文排版', values: ['文字被裁切溢出', '字符级测宽防溢出'] },
        { label: '质量保证', values: ['人工肉眼抽检', 'WCAG 对比度 QA 门禁'] },
      ],
      verdict: '结论: 推荐全面采用 Slide Recipes 架构',
    },
    {
      type: 'content',
      title: '核心设计原则',
      lead: '设计服务于信息传达，而非无意义的视觉装饰',
      body: '所有幻灯片均严格采用统一网格尺度与层级字阶，确保汇报与提案的高管级可信度。',
      source: 'Slide Recipes 设计白皮书 2026',
    },
    { type: 'closing', title: '感谢聆听', action: '立即体验全新 Schema 生成', contact: '欢迎提交 PR 或 Issue' },
  ],
};

const deckResult = validateDeckSchema(sampleDeck);
assert.equal(deckResult.valid, true);
assert.equal(deckResult.errors.length, 0);

// 非法 recipeId 拦截
const badRecipeDeck = {
  ...sampleDeck,
  design: { recipeId: 'non-existent-recipe' },
};
const badResult = validateDeckSchema(badRecipeDeck);
assert.equal(badResult.valid, false);
assert.ok(badResult.errors.some(e => e.includes('不支持的 recipeId')));

console.log('✅ deck-schema validation tests PASS');

// 5. 端到端渲染测试
const tmpDir = await mkdtemp(join(tmpdir(), 'slide-recipes-render-'));
try {
  const pres = await renderDeckToPptx(sampleDeck);
  const outPath = join(tmpDir, 'deck-test.pptx');
  await pres.writeFile({ fileName: outPath });

  const zip = readZip(await readFile(outPath));
  const slideFiles = [...zip.keys()].filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p));
  assert.equal(slideFiles.length, 12, '生成的 PPTX 应包含全部 12 页');

  for (const file of slideFiles) {
    const parsed = parseSlide(Buffer.from(zip.get(file)).toString());
    assert.ok(parsed.shapes.some(x => x.text), `幻灯片 ${file} 应该包含文本`);
    for (const shape of parsed.shapes) {
      assert.ok(shape.x >= -0.01 && shape.y >= -0.01, `越界负数: ${shape.x}, ${shape.y}`);
      assert.ok(shape.x + shape.w <= 10.01 && shape.y + shape.h <= 5.63, `超出画布边界: ${shape.x + shape.w}, ${shape.y + shape.h}`);
    }
  }

  console.log(`✅ deck-renderer end-to-end test PASS: 12 native slides rendered and verified cleanly`);
} finally {
  await rm(tmpDir, { recursive: true, force: true });
}
