import pptxgen from 'pptxgenjs';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createCommercialRecipe, commercialRecipes } from '../skills/themed-cn-pptx/recipes/recipe-commercial.mjs';

export function buildCommercialDemo(pres, id) {
  const r = createCommercialRecipe(pres, id, { label: `${commercialRecipes[id].label} · 演示内容，非真实业务数据`, fontFace: process.env.PPT_FONT || 'Microsoft YaHei' });
  const names = { 'investor-signal': ['让增长\n更有确定性', 'INVESTOR UPDATE / 2026'], 'editorial-proposal': ['让品牌\n形成共识', 'BRAND STRATEGY / 2026'], 'studio-monochrome': ['让创意\n转化为行动', 'STUDIO PROPOSAL / 2026'] };
  r.cover({ title: names[id][0], kicker: names[id][1], subtitle: '从清晰的判断，到可衡量的结果。', page: 1 });
  r.agenda({ title: '今天，我们做三个决定', page: 2, items: [
    { title: '识别关键机会', body: '看清业务约束与用户需求' },
    { title: '聚焦可行路径', body: '用证据选择优先级' },
    { title: '明确交付边界', body: '把范围、节奏与投入说清楚' },
  ] });
  r.section({ number: '01', title: '从假设出发，\n用证据收敛', summary: '把精力放在能够改变决策的信息上。', page: 3 });
  r.metrics({ title: '增长来自稳定的重复使用', stats: [{ value: '86%', label: '示例留存率 · 30 天' }, { value: '2.4×', label: '示例效率对比 · 同口径' }],
    categories: ['Q1','Q2','Q3','Q4'], values: [24,38,52,68], seriesName: '活跃团队（个）', source: '虚构演示数据 · 2026 · 单位：团队数', page: 4 });
  r.comparison({ title: '把资源投向可验证的路径', columns: ['一次性交付', '持续迭代'], rows: [
    { label: '交付方式', values: ['最终文件', '分阶段成果'] },
    { label: '验证节奏', values: ['项目结束', '每阶段复盘'] },
    { label: '决策依据', values: ['经验判断', '反馈与指标'] },
    { label: '适用情境', values: ['需求已确定', '需求需探索'] },
  ], verdict: '选择依据：需求的不确定性，而非服务形式的高低。', page: 5 });
  r.caseStudy({ title: '让复杂的信息更容易使用', client: '示例案例 / Atlas', problem: '资料分散，信息口径不一致。', approach: '统一内容结构与维护流程。', outcome: '形成可复用的交付标准。', source: '虚构案例 · 左侧为可编辑几何图形，非客户作品', page: 6 });
  r.scope({ title: '把服务范围与投入说清楚', items: [
    { title: '策略梳理', body: '访谈与资料审阅\n一份策略简报', price: '范围：2 次工作坊' },
    { title: '设计系统', body: '核心页面与规范\n一套交付文件', price: '范围：8 类页面' },
    { title: '实施支持', body: '应用演练与答疑\n一次复盘建议', price: '范围：2 周支持' },
  ], note: '示例服务范围，非实际报价；第三方素材、税费与追加修改需另行约定。', page: 7 });
  r.closing({ title: '下一步，\n让共识变成行动。', action: '明确项目目标，确认负责人，安排首次工作坊。', contact: 'NEXT STEP / 确认项目简报', page: 8 });
  return pres;
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const output = resolve(process.argv[2] || 'examples/slides/output/commercial');
  await mkdir(output, { recursive: true });
  for (const id of Object.keys(commercialRecipes)) {
    const pres = new pptxgen(); buildCommercialDemo(pres, id);
    const file = resolve(output, `${id}.pptx`); await pres.writeFile({ fileName: file }); console.log(file);
  }
}
