import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateDeckSchema, validateSlide, SLIDE_TYPES, SUPPORTED_RECIPE_IDS, SUPPORTED_OCCASIONS, OCCASION_PRESETS } from '../skills/slide-recipes/lib/deck-schema.js';
import { renderDeckToPptx } from '../skills/slide-recipes/lib/deck-renderer.js';
import { readZip } from '../skills/slide-recipes/lib/zip-reader.js';
import { parseSlide } from '../skills/slide-recipes/lib/pptx-shapes.js';

console.log('Testing deck-schema.js & deck-renderer.js...');

// 1. 基本常数检查
assert.equal(SLIDE_TYPES.length, 25);
assert.ok(SLIDE_TYPES.includes('kpiDashboard'));
assert.ok(SLIDE_TYPES.includes('funnel'));
assert.ok(SLIDE_TYPES.includes('gantt'));
assert.ok(SLIDE_TYPES.includes('swot'));
assert.ok(SLIDE_TYPES.includes('milestoneTimeline'));
assert.ok(SLIDE_TYPES.includes('featureGrid'));
assert.ok(SLIDE_TYPES.includes('statCallout'));
assert.ok(SLIDE_TYPES.includes('architectureStack'));
assert.ok(SLIDE_TYPES.includes('marketSize'));
assert.ok(SLIDE_TYPES.includes('faq'));
assert.equal(SUPPORTED_RECIPE_IDS.length, 11);
assert.ok(SUPPORTED_RECIPE_IDS.includes('investor-signal'));
assert.ok(SUPPORTED_RECIPE_IDS.includes('consulting-dense'));
assert.ok(SUPPORTED_RECIPE_IDS.includes('tech-keynote'));

assert.equal(SUPPORTED_OCCASIONS.length, 15);
assert.equal(OCCASION_PRESETS.length, 15);
assert.ok(SUPPORTED_OCCASIONS.includes('01-business-report'));
assert.ok(SUPPORTED_OCCASIONS.includes('11-consulting'));
assert.ok(SUPPORTED_OCCASIONS.includes('15-kids-playful'));

// 场合校验测试
const invalidOccasionRes = validateDeckSchema({
  design: { occasion: 'unknown-occasion' },
  slides: [{ type: 'cover', title: '测试' }],
});
assert.equal(invalidOccasionRes.valid, false);
assert.ok(invalidOccasionRes.errors[0].includes('不支持的 occasion'));

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
      type: 'milestoneTimeline',
      title: '产品落地里程碑',
      milestones: [
        { date: '2026 Q1', title: '核心引擎发布', body: '完成 Schema 规范统一与校验', status: 'done' },
        { date: '2026 Q2', title: '生态模板扩充', body: '支持 28 款调色盘与 23 种版式', status: 'doing' },
        { date: '2026 Q3', title: '企业服务集成', body: '开放私有化部署 SDK', status: 'todo' },
      ],
      note: '基准版本规划',
    },
    {
      type: 'featureGrid',
      title: '四大核心能力矩阵',
      features: [
        { badge: '01', title: '对比度质检', desc: 'WCAG >= 4.5:1 自动化对比度门禁' },
        { badge: '02', title: '多平台一致性', desc: 'Mac/Windows/WPS 严格矢量渲染' },
        { badge: '03', title: '结构化生图', desc: '语义化负空间与材质提示词' },
        { badge: '04', title: '丰富商业组件', desc: '覆盖漏斗/甘特/架构/时序等版式' },
      ],
      note: '平台能力总览',
    },
    {
      type: 'statCallout',
      title: '核心交付成效',
      stat: '99.4%',
      label: '版式质检合格率',
      takeaway: '彻底告别低质量 PPT 乱码与裁切溢出',
      details: [
        '排版耗时由传统平均 3.5 小时降低至 15 秒',
        '高管评审通过率提升 42%，无缝导出标准矢量 PPTX',
      ],
      note: '2026 Q1 内部试点评估',
    },
    {
      type: 'architectureStack',
      title: '分层技术架构体系',
      layers: [
        { name: '展现与交互层', items: ['Web Studio', 'CLI 工具', 'IDE 插件'] },
        { name: '规约与渲染层', items: ['DeckSchema', 'PptxGenJS 引擎', 'Prompt 编译器'] },
        { name: '设计资产层', items: ['28 组语义调色盘', '23 种商业组件', '11 套视觉配方'] },
      ],
      note: '系统全景图',
    },
    {
      type: 'marketSize',
      title: '潜在市场空间测算',
      tiers: [
        { name: 'TAM 全球潜在市场', value: '$45B', desc: '全球企业级演示文稿与自动化设计市场总额' },
        { name: 'SAM 可服务市场', value: '$12B', desc: '中大型企业智能办公与统一品牌视觉生成' },
        { name: 'SOM 目标渗透市场', value: '$2.5B', desc: '前三年亚太及出海业务可直接触达份额' },
      ],
      note: '数据源: Gartner 2026 企业软件分析',
    },
    {
      type: 'faq',
      title: '常见疑问与回答',
      questions: [
        { question: '导出的 PPTX 是否支持二次编辑？', answer: '100% 原生矢量形状与文本框，所有图表与文字均可自由修改。' },
        { question: '如何保证在跨平台投影时不乱码？', answer: '使用系统内置的标准 CJK 安全字体阶梯，并经自动化渲染门禁核验。' },
      ],
      note: '更多细节请查阅技术白皮书',
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
  assert.equal(slideFiles.length, 18, '生成的 PPTX 应包含全部 18 页');

  for (const file of slideFiles) {
    const parsed = parseSlide(Buffer.from(zip.get(file)).toString());
    assert.ok(parsed.shapes.some(x => x.text), `幻灯片 ${file} 应该包含文本`);
    for (const shape of parsed.shapes) {
      assert.ok(shape.x >= -0.01 && shape.y >= -0.01, `越界负数: ${shape.x}, ${shape.y}`);
      assert.ok(shape.x + shape.w <= 10.01 && shape.y + shape.h <= 5.63, `超出画布边界: ${shape.x + shape.w}, ${shape.y + shape.h}`);
    }
  }

  console.log(`✅ deck-renderer end-to-end test PASS: 18 native slides rendered and verified cleanly`);
} finally {
  await rm(tmpDir, { recursive: true, force: true });
}
