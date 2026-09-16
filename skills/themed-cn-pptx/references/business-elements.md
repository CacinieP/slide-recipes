# 商业 PPT 元素 API

入口仍为 `createCommercialRecipe(pres, recipeId, options)`，返回对象新增以下 10 个方法。
全部使用原生文字与图形；图表类数据不能用生成图片替代。画布仍为 10 × 5.625 英寸。

| 方法 | 参数（共同字段 title、page?） | 内容与数值契约 |
| --- | --- | --- |
| executiveSummary | decision, evidence[], nextStep | evidence 为 2–3 条短证据；decision 为一句决策 |
| kpiDashboard | items[{label,value,change,context}], note | 3–4 项；value 是显示字符串；change/context 明确对比周期和口径 |
| processFlow | steps[{title,body}], note? | 3–4 个阶段；标题短于正文 |
| funnel | stages[{label,value}], note | 3–5 阶段；value 为非负有限数；首项 >0，后续不得递增；同一队列 |
| gantt | periods[], tasks[{label,start,end}], note? | 4–8 等距时期、3–5 任务；start/end 为从 0 开始的整数，含终点；不自动推断日期间隔或依赖 |
| quadrant | xLabel, yLabel, points[{label,x,y}], note | 1–5 点；x/y 为 [0,1] 有限数，左低右高、下低上高；分数需说明依据 |
| swot | strengths[], weaknesses[], opportunities[], threats[] | 每个象限 1–2 条；内外部因素分开 |
| team | people[{name,role,bio,initials?,image?}], note? | 2–3 人；无头像时使用字母标识，不能伪造真实人物 |
| pricing | plans[{name,price,period,features[],recommended?}], note | 2–3 方案，每项 2–3 特性；price 为含币种字符串；note 明确税费/例外 |
| testimonial | quote, author, role, source | 来源必填；演示引文应标明虚构；正式交付使用可核实原话 |

`note`/`source` 的数据说明必填约束仅检查存在，不能替代事实核实。
KPI、报价、证言不自动做数学或真实性判断。矩阵点过近会遮挡，渲染后应调整标签/拆页，不改动原始评分。
漏斗宽度严格与数值成比例；零值保留标签、不绘制虚假最小条。甘特图是等距时段示意，跨月长短不等时应预先建立合适的时间尺度。
超过槽位容量会报错，优先精简/拆页；不要抹去来源或缩至不可读字号。

```js
const r = createCommercialRecipe(pres, 'investor-signal', { palette: 'forest-sand' });
r.funnel({
  title: '首要问题在激活阶段', page: 4,
  stages: [{label:'注册',value:1000},{label:'激活',value:400},{label:'付费',value:120}],
  note: '演示数据 · 同一队列 · 30 天 · 单位：人'
});
```

## 配色 API

`palette` 接受预设 ID，或部分语义角色映射。实现为 `lib/business-palette.js`。
预设：navy-teal / forest-sand / cobalt-white / burgundy-cream / graphite-orange。
角色：paper、ink、muted、accent、highlight、line、dark、light。HEX 可含一个 `#`，内部统一大写六位值。
任何拼错的角色、非法颜色、关键文字低对比度都会报错。
对比度检查覆盖 ink/paper、muted/paper、accent/paper、light/dark、highlight/dark、light/ink、light/accent。
`line` 仅做装饰分隔，不作为关键信息唯一编码；真实照片背景仍需另行检查。

完整提示词与配色示例位于仓库中英文 README；独立安装后的使用者可以直接要求：
“按[受众/目的/材料]生成[页数]页 PPT，使用[recipe]与[palette]，包含[元素列表]，保留真实数据和可编辑对象，生成后渲染 QA。”

完整 20 套预设及角色值见 [palette-catalog.md](palette-catalog.md)。
