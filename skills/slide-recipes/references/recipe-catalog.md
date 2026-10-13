# Recipe 选型与内容契约

先按内容关系选版式，再选视觉。旧 recipe `editorial-grid` 与 `dark-launch` 保留。
新 recipe 位于 `recipes/recipe-collection.mjs`，通过 `createRecipe(pres, id)` 创建；不会自动插入示例文案。

| ID | 适用 | 构图与节奏 | 配图要求 | 不适用 |
| --- | --- | --- | --- | --- |
| research-report | 研究、复盘、行业报告 | 左侧证据 60%，右侧结论；底部来源 | 真实图表/实验图优先，AI 只用于概念示意 | 无证据的营销口号 |
| product-story | 产品介绍、功能讲解 | 左文右图；每页一个用户收益 | 真实产品截图优先，AI 用于使用场景 | 密集指标表 |
| magazine-story | 品牌故事、文化分享 | 非对称大字、窄幅竖图、暖白底 | 统一镜头与材质，主体留在裁切安全区 | 多列详细数据 |
| roadmap-brief | 计划、里程碑、执行汇报 | 2–4 个等距节点；日期、成果、责任内容分层 | 默认不用装饰图 | 无时间顺序的比较 |
| editorial-grid | 决策简报、中文信息汇总 | 发丝线、网格、克制色彩 | 少量卡片图 | 戏剧化发布会 |
| dark-launch | 新品发布、演讲开场 | 深底、大标题、hero、收尾 CTA | 为标题保留负空间 | 连续密集长文 |
| consulting-dense | 顶级战略咨询、研报汇报 | 高信息密度网格、结构化结论、三段式证明 | 极简矢量图表优先 | 纯营销大图空洞文案 |
| tech-keynote | 前沿科技大会、发布会 | 深色高对比、荧光点缀、超大视觉中心 | 概念渲染图保留负空间 | 密集文字合同条款 |

```js
import pptxgen from 'pptxgenjs';
import { createRecipe } from './skill/recipes/recipe-collection.mjs';
const pres = new pptxgen();
const r = createRecipe(pres, 'product-story', { label: '产品介绍' });
r.cover({ title: '减少重复工作', subtitle: '让团队专注于决策' });
r.content({ title: '一处更新，全员同步', lead: '少一次手动传递',
  body: '在这里填写真实的产品能力与使用场景。', image: './assets/product.png' });
await pres.writeFile({ fileName: 'product.pptx' });
```

画布为 10 × 5.625 英寸。传入真实图片路径；无图时保持中性空白区，必要时改成原生图表。
封面标题建议两行以内，正文每槽建议 50–70 个中文字符以内。内容超出时拆页或改版式，不能只缩小字号。
`content` 可接收 `source`；时间线使用 `items: [{date, title, body}]`，2–4 项。
配图不会承载正文、数据标签或二维码。生成后仍需做静态及渲染 QA。

## 商业与专业提案扩展（现已支持 11 套 Recipes）

`recipes/recipe-commercial.mjs` 提供 `investor-signal`、`editorial-proposal`、`studio-monochrome` 等专业方案。
每套包含封面、议程、章节、原生指标图表、双方案比较、案例、服务范围、收尾八类页面。
新增 `consulting-dense` 与 `tech-keynote`，支持多层级商业架构与高管汇报。
详见 [commercial-recipes.md](commercial-recipes.md) 的参数契约与 [design-research.md](design-research.md) 的 Pinterest/商业模板参考。
建议需要完整提案时优先使用这组；旧四套轻量 recipe 保持兼容，用于短简报。
