# Design decision playbook / 内容驱动改版手册

Use before implementation. This is a **human creative plan, not machine schema**. Labels below do not extend DeckSchema, recipe arguments or ImagePromptSchema. Resolve actual method names and parameters through [recipe-catalog.md](recipe-catalog.md), [commercial-recipes.md](commercial-recipes.md) and [business-elements.md](business-elements.md). Visual measurements come from [aesthetic-rules.md](aesthetic-rules.md).

## Compact brief / 设计决策单

```text
Audience / 受众与已有知识:
Decision or action / 看完要做什么:
Use / 演讲或阅读、时长、页数、语言:
Evidence / 来源、日期、可用事实、待补证据:
Constraints / 品牌、禁区、格式、授权、QR目标:
Narrative / 当前状况 → 关键判断 → 证明 → 行动:
Canvas / 物理尺寸、字体可用性、渲染条件:
System / 字号阶、网格、颜色角色、密度节奏:
Images / 每张图片的证据或解释用途；无用途则不用:
Avoid / 与内容无关的装饰、失真或不适合的风格:
Representative pages / 封面、证据页、最密页；确认或直做豁免:
```

## Page plan / 逐页计划

| Page | Claim / 结论 | Evidence / 来源与缺口 | Relationship / 信息关系 | Composition / 焦点与网格 | Recipe mapping / 实现入口 | Review risk |
| --- | --- | --- | --- | --- | --- | --- |
| n | 一句话；未证实就写待验证问题 | 事实、数据口径、素材出处 | 趋势/比较/因果/顺序/层级 | 焦点、主次区域、保留留白 | 已存在的方法；自绘原生对象另注明 | 字体/密度/图表口径/权限 |

For each page, ask: What is the first thing a viewer sees? What proves it? What can be deleted without losing meaning? Is a panel communicating grouping, or merely filling space? Use native shapes/text for a needed custom diagram; do not pretend a `causalChain` or `evidenceLayout` API exists.

## Case 1 — Operating review / 经营汇报

**Source text supplied for this example (qualitative, not measured company results):**
“收入、成本、回款三个方面需要讨论。收入按渠道拆分还未核对，成本口径已调整，回款存在逾期；本次会议需要决定跟进责任。附件表格待财务确认。”

**Before:** three equal rounded cards titled “收入增长 / 成本优化 / 回款改善”, three icons and an unsupported giant growth number. This invents positive results and gives uncertain topics equal authority.

**After:** title “先确认口径，再分配逾期回款跟进责任”. On an editorial grid, use the left two-thirds for a compact native table with rows “收入渠道拆分 / 成本口径 / 逾期回款” and columns “已知 / 待核实 / 下一步”; on the right, one decision block “确认负责人和核对时间（待会议决定）”. Source note: “用户材料；附件尚待财务确认”. No numeric chart until real data arrives. Delete icon circles, shadows and decorative card backgrounds; keep separators that help scan rows.

**Mapping:** `editorial-grid` visual family; table is custom native text/lines in the build, not a new recipe method. When a verified common-period dataset exists, `investor-signal` commercial `metrics` supports `categories`, `values`, `stats`, `seriesName`, `source`; enforce its 2–6 nonnegative value constraint and do not coerce incompatible data. Show one dominant comparison, not three competing KPI heroes.

**Representative check:** can the reviewer distinguish a supplied fact from a pending decision? Are units/period/base visible once numbers arrive? The dense table is the representative content page. Missing evidence is a content gap, not a reason to generate a picture.

## Case 2 — Academic mechanism / 学术机制

**Source text supplied for this example (a hypothesis, not an experimental finding):**
“我们假设处理 A 通过中介 B 影响结果 C。已有材料只描述观察到的相关性；尚未提供干预实验、样本量或误差范围。需要解释下一步怎样验证。”

**Before:** four cards “背景 / 方法 / 结果 / 意义”, each with a stock lab icon; a generated molecule picture implies experimental evidence, and an arrow caption says “A 导致 C”.

**After:** title “A–B–C 是待验证路径，而非已证实因果”. Use a left-to-right native diagram A → B → C in the main evidence area with dashed hypothesis arrows and a legend. A smaller right column distinguishes “材料支持：相关性描述” from “仍缺：干预、样本量、误差”. Below, a separate next-step line “补充实验设计后再讨论因果结论”. Mark the mechanism “示意；待验证”, cite the supplied source, and do not manufacture a paper citation. If a real figure is later provided, keep its axes/legend and rights intact.

**Mapping:** `research-report` uses an evidence-led left region and conclusion on the right. Its documented `content` inputs include title/lead/body/image/source; custom editable mechanism geometry requires the build script's native shapes/text, not an invented schema field. Split mechanism and experimental plan into two pages if body-size labels do not fit. No AI-generated experimental panels.

**Representative check:** are hypotheses visually distinct from observation? Does the arrow legend prevent causal overclaim? Inspect Greek/CJK glyphs and source legibility; avoid small labels to fit every method detail.

## Case 3 — Product launch / 产品发布

**Source text supplied for this example (feature claims only, no invented metrics):**
“产品支持导入文件、搜索内容和共享链接。当前有真实界面截图，但没有节省时间的研究数据。发布页希望邀请用户试用。”

**Before:** six feature cards (three copied with new adjectives), six shiny icons, “效率提升 80%” and an invented AI dashboard. The cards compete with the invitation and falsely imply measured outcomes.

**After:** cover says “从文件到可分享的内容”, with one genuine product screenshot or a typographic composition if screenshot rights are unclear. Next page follows the actual task “导入 → 搜索 → 分享”: one large screenshot region with three numbered native callouts, only if those controls really appear in the supplied screenshot. Otherwise split into three real screenshots or explain the sequence as a native diagram. End with one CTA “试用并反馈你的工作流程”, a verified URL and optional real QR. Remove duplicate benefits and unsupported percentage. Describe the desired benefit as an intention, not a measured result.

**Mapping:** `dark-launch` for opener/CTA only where suitable; `product-story` `content({ title, lead, body, image, source })` for a genuine screenshot and user task. Keep grid/type/color consistent across both families; a custom callout layer belongs to native build objects, not a new recipe argument. Validate recipe-specific QR embedding rather than assuming `closing` accepts a QR parameter.

**Representative check:** cover plus screenshot page may suffice for a short launch deck. Check crop/actual UI truthfulness and CTA readability; scan the final QR. No automatic hero generation just because the style is “launch”.

## Workflow rehearsal / 工作流走查方法

Use Case 1 as a no-generation rehearsal: extract the request and unresolved evidence → choose live-talk canvas/type → draft the page plan → select cover + table/evidence page (same as densest page) → request one direction check or record direct-build instruction → expand only after that → map native objects and documented API → list technical checks and separately list rendered/user review still pending. A paper walkthrough exercises decision logic; it is not a generated PPTX or visual acceptance test.
