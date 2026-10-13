# 商业提案 recipe 契约

实现：`recipes/recipe-commercial.mjs`。公开参考与改造理由见 [design-research.md](design-research.md)。

| recipe | 视觉系统 | 封面差异 | 使用情境 |
| --- | --- | --- | --- |
| investor-signal | 森林绿、暖白、浅绿；环形几何 | 深底左标题、右轨道图形 | 融资、经营复盘；证据必须真实 |
| editorial-proposal | 暖白、炭黑、钴蓝；竖向网格 | 左文右图、非对称比例 | 品牌策略、设计提案、客户案例 |
| studio-monochrome | 黑白、灰阶；排版与重复线条 | 大标题横向主导，无默认照片框 | 创意工作室、作品与服务介绍 |

均为 10 × 5.625 英寸，支持 `fontFace`、`label`、`mode`、`palette` 配置。
英文使用词边界断行，中文按字估算并保留尾标点；过长文本报错，要求精简/拆页。
字号阶为封面 39–47、章节 34、内容标题 29、正文约 16、数据标签 10–14pt；密集表格适合近距离阅读。
`mode: document` 将议程说明、案例正文、范围正文从 16pt 调为 13pt；图表/表格的固定标签不变。具体页面仍需渲染确认。
演示脚本支持 `PPT_FONT` 环境变量；生成前检查字体实际安装情况，不应假设 Microsoft YaHei 在 macOS/Linux 存在。

## 页面 API

| 方法 | 参数（除 page 外均按内容需要填写） | 约束 |
| --- | --- | --- |
| cover | title, subtitle, kicker, image?, page? | title 建议两行；图片为空时用原生几何构图 |
| agenda | title, items[{title,body}], page? | 2–4 项，分别承担章节与说明 |
| section | number, title, summary, page? | 大编号和短结论；深色过渡页 |
| metrics | title, stats[{value,label}], categories, values, seriesName, source, page? | 1–3 指标、2–6 非负数值，图表数组等长，来源必填；原生柱图 |
| comparison | title, columns, rows[{label,values}], verdict, page? | 两方案、2–4 行；每行两项值 |
| caseStudy | title, image?, client, problem, approach, outcome, source, page? | 挑战→方法→结果；无图用几何图形，不能假称客户作品 |
| scope | title, items[{title,body,price}], note, page? | 2–3 列；price 可为实际价格或明确范围；note 写计价假设/不包含项 |
| closing | title, action, contact, page? | 清楚的行动、责任或联系方式 |

```js
import pptxgen from 'pptxgenjs';
import { createCommercialRecipe } from './skill/recipes/recipe-commercial.mjs';
const pres = new pptxgen();
const r = createCommercialRecipe(pres, 'editorial-proposal', { label: '品牌策略提案' });
r.cover({ title: '让品牌\n形成共识', subtitle: '从洞察到交付', kicker: 'BRAND STRATEGY', page: 1 });
r.scope({ title: '本阶段的服务范围', page: 2, items: [
  { title: '调研', body: '访谈与分析', price: '范围：两次访谈' },
  { title: '策略', body: '定位与核心叙事', price: '范围：一份简报' }
], note: '费用与变更机制以具体约定为准。' });
await pres.writeFile({ fileName: 'proposal.pptx' });
```

## 图片与商业证据

生图只承担情境/概念素材，不能伪造业绩、客户评价、产品截图或团队照片。
生成配图前固定 `subject / composition / negativeSpace / palette / medium / crop`，每页复用同一材质与光线描述。
原生几何图形是完整的无照片视觉方案，不是假素材占位。传入图片时使用 cover 裁切并检查主体。
交付包括构建源文件、PPTX、素材来源和 QA 状态。仓库演示全部标明虚构数据。

## 商业元素与配色扩展

返回对象还包含 10 个商业元素方法，合计 18 类页面/元素 API，详见 [business-elements.md](business-elements.md)。`palette` 可传预设 ID 或语义角色覆盖；它与 recipe 独立，保留构图并替换颜色。
