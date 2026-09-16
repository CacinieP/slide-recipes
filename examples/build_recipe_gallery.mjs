import pptxgen from 'pptxgenjs';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createRecipe } from '../skills/themed-cn-pptx/recipes/recipe-collection.mjs';
const pres = new pptxgen();
const scenarios = [
  ['research-report', '研究报告', '先展示证据，再解释结论', '让证据支撑判断', '图表区用于真实研究数据', '结论应包含适用条件与不确定性。示例空白区可替换为真实图表。'],
  ['product-story', '产品展示', '围绕用户任务组织故事', '从用户收益开始', '少一次手动传递', '说明具体的使用场景、操作变化与实际收益。右侧放产品截图或场景图。'],
  ['magazine-story', '杂志叙事', '以文字节奏和图像构图讲故事', '一个观点，一页空间', '留白，让观点被看见', '暖白底、短句与非对称构图；图像延续叙事，不抢夺文字的阅读顺序。'],
  ['roadmap-brief', '路线图', '把计划变成可验收的成果', '先验证，再扩大', '', ''],
];
for (const [id, title, subtitle, heading, lead, body] of scenarios) {
 const r = createRecipe(pres, id, { label: `slide-recipes · ${title}` });
 r.cover({ title, subtitle });
 r.content({ title: heading, lead, body, source: id === 'research-report' ? '示例布局 · 未使用真实研究数据' : '',
 items: [{ date: '第 1 阶段', title: '发现问题', body: '完成访谈，形成问题清单。' }, { date: '第 2 阶段', title: '验证方案', body: '测试原型，记录反馈。' }, { date: '第 3 阶段', title: '扩大应用', body: '复盘效果，明确下一步。' }] });
}
const out = resolve(process.argv[2] || 'examples/slides/output/recipe-gallery.pptx');
await mkdir(dirname(out), { recursive: true });
await pres.writeFile({ fileName: out });
console.log(out);
