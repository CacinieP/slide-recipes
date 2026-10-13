import pptxgen from 'pptxgenjs';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createCommercialRecipe } from '../skills/slide-recipes/recipes/recipe-commercial.mjs';

/**
 * Slide Recipes 仓库官方产品介绍与能力全景 PPT
 * 使用全新的 consulting-navy 商业色板与 23 款商用矢量版式
 */
export function buildSlideRecipesShowcase(pres, options = {}) {
  const r = createCommercialRecipe(pres, 'editorial-proposal', {
    label: 'Slide Recipes · 官方项目介绍与架构全景',
    fontFace: process.env.PPT_FONT || 'Microsoft YaHei',
    palette: 'consulting-navy',
    ...options,
  });

  // 1. 封面
  r.cover({
    title: 'Slide Recipes',
    subtitle: '面向 AI 时代的高质感、可编辑商业 PPT 生成与规范引擎',
    kicker: 'OFFICIAL REPOSITORY SHOWCASE',
  });

  // 2. 执行摘要 (executiveSummary)
  r.executiveSummary({
    title: '为什么需要 Slide Recipes？',
    decision: '告别图片化\n回归原生矢量',
    evidence: [
      '传统 AI PPT 严重依赖整页图片渲染，文字无法微调，商业数据失真',
      '中文全角排版常发生字符溢出裁切，色板缺乏 WCAG 工业级对比度保障',
      '缺少成熟的商业咨询分析结构（KPI、漏斗、甘特、架构、时序等）',
    ],
    nextStep: '方案：以统一 Schema 规范、28 款合规色板与 23 种原生矢量组件，重塑生成范式。',
    page: 2,
  });

  // 3. 核心指标成果 (statCallout) - 新增模板
  r.statCallout({
    title: '核心交付成效与质量跃升',
    stat: '100%',
    label: '原生矢量对象率',
    takeaway: '纯原生矢量几何与文本，100% 支持 Office/WPS 二次编辑',
    details: [
      '端到端生成耗时缩短至 15 秒，零人工对齐排版负担',
      '全链路 WCAG >= 4.5:1 对比度拦截，根除投影与暗光下的阅读障碍',
      'CJK 字符级测宽算法，精准防止中文标题与正文换行裁切',
    ],
    note: '指标口径：Slide Recipes v2.4.0 核心引擎测试基准',
    page: 3,
  });

  // 4. 四大核心能力矩阵 (featureGrid) - 新增模板
  r.featureGrid({
    title: '四大核心架构支柱',
    features: [
      {
        badge: '01',
        title: '28 套 WCAG 合规色板',
        desc: '从北欧鼠尾草到咨询深蓝，7 组角色对比度均严格 ≥ 4.5:1，告别刺眼杂色。',
      },
      {
        badge: '02',
        title: '23 款商用结构版式',
        desc: '涵盖漏斗、甘特、优先级矩阵、SWOT、架构堆叠等高管咨询与商业汇报必备。',
      },
      {
        badge: '03',
        title: '统一 DeckSchema 规约',
        desc: '支持前后端、Web Studio、CLI 与 Agent 跨平台驱动，严格 JSON 校验拦截。',
      },
      {
        badge: '04',
        title: '结构化 AI 提示词规范',
        desc: '负空间感知、材质指定、去除牛皮癣文本，实现商业级摄影配图融合。',
      },
    ],
    note: '体系结构：底层 PptxGenJS 原生矢量驱动',
    page: 4,
  });

  // 5. 关键业务健康度 (kpiDashboard)
  r.kpiDashboard({
    title: '核心能力资产矩阵全景',
    items: [
      { label: '商业语义调色盘', value: '28 套', change: '新增 +8 套', context: '全量 WCAG 合规' },
      { label: '商用版式组件', value: '23 款', change: '新增 +4 款', context: '覆盖高管汇报全场景' },
      { label: '视觉场景配方', value: '11 套', change: '新增 +2 套', context: '咨询高密 & 科技 Keynote' },
      { label: '自动化质检拦截', value: '100%', change: '零容忍', context: '对比度/溢出/渲染 QA' },
    ],
    note: '统计范围：v2.4.0 正式版全量组件库',
    page: 5,
  });

  // 6. 系统分层架构 (architectureStack) - 新增模板
  r.architectureStack({
    title: 'Slide Recipes 技术架构体系',
    layers: [
      {
        name: '交互与应用层',
        items: ['Next.js 16 Web Studio', 'Antigravity / Claude Skill', 'CLI 命令行工具'],
      },
      {
        name: '规约与调度层',
        items: ['统一 DeckSchema 规范', 'LLM 结构化提示编译器', '参数合法性拦截器'],
      },
      {
        name: '排版与渲染引擎',
        items: ['PptxGenJS 矢量生成器', 'CJK 字符测宽防溢出', 'AI 配图 Provider 适配层'],
      },
      {
        name: '质检门禁体系',
        items: ['WCAG 色彩对比度检测', 'LibreOffice 渲染闭环 QA', 'XML 边界坐标合规验证'],
      },
    ],
    note: '架构图：高内聚低耦合分层设计',
    page: 6,
  });

  // 7. 方案选型对比 (comparison)
  r.comparison({
    title: '方案选型对比：为什么告别传统方案？',
    columns: ['传统 AI PPT', 'Slide Recipes'],
    rows: [
      { label: '交付格式', values: ['整页图片不可改', '原生可编辑矢量'] },
      { label: '排版对齐', values: ['中文字符截断溢出', '严格 CJK 测宽网格'] },
      { label: '商业逻辑', values: ['堆砌文本条目', '23 款高管分析版式'] },
      { label: '色彩规范', values: ['高饱和不可读杂色', '28 款合规严选色板'] },
    ],
    verdict: '选型结论：Slide Recipes 是企业级汇报与 Agent 自动化的最优底座。',
    page: 7,
  });

  // 8. 演进路线图与里程碑 (milestoneTimeline) - 新增模板
  r.milestoneTimeline({
    title: '产品演进规划与核心里程碑',
    milestones: [
      {
        date: '2026 Q1',
        title: 'v2.0 规范化重构',
        body: '统一项目命名与 DeckSchema，实现 Skill 与 Web 架构并网。',
        status: 'done',
      },
      {
        date: '2026 Q2',
        title: 'v2.4 生态大扩充',
        body: '升级至 28 套合规色板、23 类商用版式与 11 套 Recipes。',
        status: 'done',
      },
      {
        date: '2026 Q3',
        title: 'v3.0 深度集成',
        body: '推出多 Agent 协作工作流与企业级私有化部署 SDK。',
        status: 'doing',
      },
    ],
    note: '规划路径：持续打造开源领域最高质感的演示文稿引擎',
    page: 8,
  });

  // 9. 方案服务与支持 (pricing)
  r.pricing({
    title: '接入方式与生态方案',
    plans: [
      {
        name: '开源社区版',
        price: 'Free',
        period: 'MIT 开源许可',
        features: ['完整源码与文档', '本地 CLI 与 Skill 运行', '全套预设色板与版式'],
      },
      {
        name: 'Web 交互工作台',
        price: '开箱即用',
        period: '本地部署 / 云端托管',
        recommended: true,
        features: ['可视化大纲生成', '实时预览卡片', '一键导出标准 PPTX'],
      },
      {
        name: '企业级集成',
        price: '按需集成',
        period: '私有化 SDK 支持',
        features: ['品牌专属色板定制', '私有知识库直出', 'CI/CD 自动化集成'],
      },
    ],
    note: '开源地址：https://github.com/CacinieP/slide-recipes',
    page: 9,
  });

  // 10. 收尾行动 (closing)
  r.closing({
    title: '立即开启专业 PPT 创作',
    action: '访问 GitHub 仓库，体验全新 v2.4.0 商业模板体系',
    contact: 'GitHub: https://github.com/CacinieP/slide-recipes · 欢迎 Star & PR',
  });

  return pres;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = resolve(process.argv[2] || 'examples/slides/output/slide-recipes-showcase.pptx');
  await mkdir(dirname(output), { recursive: true });
  const pres = new pptxgen();
  buildSlideRecipesShowcase(pres);
  await pres.writeFile({ fileName: output });
  console.log(`Successfully generated showcase PPTX at: ${output}`);
}
