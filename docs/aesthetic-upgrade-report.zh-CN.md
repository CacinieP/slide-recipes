# PPT skill 审美工作流升级：变更与验证报告

## 基线与范围

- 日期：2026-10-23；仓库：https://github.com/CacinieP/slide-recipes。
- 基线 commit：`69644b88a303df8ce98a128a5195f7ea0404caa3`；重新克隆后初始 `git status --short` 为空。
- 实际工作目录：`/Users/caciniep/Movies/Hub/Projects/https github.com Cac-2/.hilo/code/cpj_94df6e3102ee473c8cbf/work/repo`。
- brief 指定的 `/tmp/slide-recipes-aesthetic-20261023` 不在本会话绑定的项目工作树内；未读取或修改它。本次在允许目录重新克隆远程仓库，因此不能证明原 `/tmp` 副本没有未提交改动，应用前请核对基线。
- 未 commit、push、创建 PR；未全局安装。版本进度使用平台 checkpoint。没有修改 renderer、recipe 实现、API/schema 或原有测试覆盖。
- 仓库既有元数据规范为 SKILL.md YAML frontmatter 的 `name`/`description`，由 scripts/validate-skills.mjs 验证；保留这一兼容形式，未新增市场枚举或虚构认证，也无需额外 meta.yaml。

## 文件变更（13 个：8 个修改，5 个新增）

| 文件 | 作用 |
| --- | --- |
| skills/slide-recipes/SKILL.md | 默认英文入口，760 行精炼为 103 行，描述 184 字符 |
| skills/slide-recipes/SKILL.cn.md（新增） | 对齐六节中文镜像，103 行，描述 74 字符 |
| skills/slide-recipes/references/aesthetic-rules.md | 保留原负面清单、商业质量、评分等实质规则；补充画布/字号/颜色角色/CJK/证据/审阅细则 |
| skills/slide-recipes/references/design-playbook.md（新增） | 人工设计决策单、逐页计划、经营/学术/产品三个文字改版案例，明确不是机器 schema |
| skills/slide-recipes/references/production-reference.md（新增） | 共享构建与修改、配图、离线 QR 完整示例、技术 QA、渲染命令、色板入口 |
| skills/slide-recipes/references/layout-slots.md | 将旧条纹契约明确为可选布局族；保留机器契约及兼容覆盖，修复陈旧章节指向/精确比例说法 |
| skills/slide-recipes/references/image-constraints.md | 尺寸近似与返回值检查、遮罩语义、非强制生图/重生 |
| skills/slide-recipes/references/recipe-catalog.md | 无图时采用有意留白或信息构图，不以占位框冒充完成 |
| skills/slide-recipes/references/commercial-recipes.md | 区分现有 document 模式13pt实现与14–16pt阅读建议，未宣称文档改变渲染默认值 |
| README.md、README.zh-CN.md | 双语升级说明、参考入口和测试边界 |
| scripts/aesthetic-docs-test.mjs（新增） | frontmatter/长度/镜像入口/本地链接及6条意图契约测试 |
| docs/aesthetic-upgrade-report.zh-CN.md（新增，本报告） | 可复核的变更、测试、走查、应用说明与限制 |

## 关键设计变化

1. 先受众、演讲/阅读、行动、结论、证据和关系，再选视觉。无用容器删除，不把所有内容塞三张卡片。
2. 固定10×5.625英寸基线：演讲正文16–20pt、阅读14–16pt；11–12pt只用于次要近读细节。13.333×7.5英寸须全系统约4/3缩放再复核，不混用字号。
3. 边距0.5–0.6、列距0.25–0.4英寸；明确块间距和层级、一个主焦点。超量先删改/拆页/附录，不默认缩字。
4. 中性色承载正文与大面积底色，品牌色+可选强调色；角色数量有上限，不用60–70%“视觉权重”。测实际前景/背景对，未声称整套色板天然AA。
5. 字体必须检查双端安装与真实字形；中文语义断行、标点避头尾、数字单位和英文词不拆。去掉无条件字体/依赖可用假设。
6. 图表标明单位/时期/基数/来源，不夸大因果；真实截图/实验图与示意明确区分。没有证据不编数字，不自动生图。
7. 代表页（封面+证据+最密页）一次方向确认后展开；短deck可减少，用户明确直做可跳过。自动技术检查、渲染视觉检查和用户批准分别记录。
8. 保留可编辑PPTX、同步Markdown、原生图表、IP主题、provider入口、二维码和QA工具；长色板采用已有palette-catalog共享入口，QR与命令移入production-reference，非完整伪代码不再放入口。
9. 默认克制不等于唯一风格；演讲、学术、活泼、编辑设计、戏剧化方向均可依据内容调整。

## 实际验证

环境：Hub提供 Node v24.21.0（execPath指向MiniMax Design/Electron）、Python 3.12.8。无全局npm，使用工作树 `node_modules/npm-local/package/bin/npm-cli.js` 项目级npm 10.9.4安装锁定开发依赖：

```bash
node ../node_modules/npm-local/package/bin/npm-cli.js ci --include=dev --ignore-scripts --cache ../node_modules/.npm-cache
node ../node_modules/npm-local/package/bin/npm-cli.js test --cache ../node_modules/.npm-cache
node scripts/aesthetic-docs-test.mjs
git diff --check
```

`npm test` 首次及加 `ELECTRON_RUN_AS_NODE=1` 重试均在 image-providers-test 的隔离安装子进程失败；随后逐项执行全部脚本，不跳过测试文件或删除断言。最终独立重跑结果如下：

| 命令 | 实测结果 |
| --- | --- |
| `node scripts/validate-skills.mjs` | 通过，exit=0 |
| `node scripts/smoke-test.mjs` | 通过，exit=0 |
| `node scripts/color-qa-presets.mjs` | 通过，exit=0 |
| `node scripts/image-providers-test.mjs` | 失败（环境限制），exit=1 |
| `node scripts/commercial-recipes-test.mjs` | 通过，exit=0 |
| `node scripts/business-elements-test.mjs` | 通过，exit=0 |
| `node scripts/deck-schema-test.mjs` | 通过，exit=0 |
| `node scripts/image-prompt-schema-test.mjs` | 通过，exit=0 |
| `node scripts/aesthetic-docs-test.mjs` | 通过，exit=0 |

- provider失败定位：scripts/image-providers-test.mjs:80 通过 `process.execPath` 启动子进程，并只保留 PATH；当前execPath是桌面应用，可输出 `[boot]` 日志，:81 `JSON.parse(stdout)` 因此报错。这不是已完成的隔离安装通过记录。前面的mock provider断言执行到了该处，但整项仍记失败。
- 尝试获取项目级独立Node作复测，版本查询404，随后官方压缩包下载超时；未安装系统工具、未继续无限重试。建议普通Node>=20环境重新运行完整 `npm ci && npm test`。
- validate通过；smoke通过；色对37/37通过；商业recipes 3套及原生chart/workbook检查通过；商业元素10类、84个色板组合通过；DeckSchema/renderer 18页结构及自定义RGB检查通过；ImagePromptSchema测试通过（无Key正常跳过真实生成）。这些“rendered”是测试代码构建/结构断言，不等于LibreOffice画面验收。
- 新测试：双语均103行、描述184/74字符，frontmatter字段与name一致，六节和关键能力标记/引用镜像匹配；62个本地链接存在检查通过。没有对所有历史远程URL或旧demo下载做在线验证。
- `git diff --check` 通过。补丁生成后会在基线解包目录 `git apply --check`、实际应用并逐文件比对；源码ZIP会CRC检查并比对全部文件，结果见交付验证节。

## 6 条触发测试（3 正、3 负）

| ID | 输入 | 预期与规则走查 |
| --- | --- | --- |
| P1 | 把这份经营复盘文稿做成8页可编辑PPT，先看关键证据。 | 触发：从文稿制作演示文稿，路径B |
| P2 | Revise slides 3 and 6 in this editable PPTX; preserve all other pages. | 触发：局部修改，路径A且保护未改页 |
| P3 | 请给中文 PowerPoint 做 render QA，检查溢出和二维码。 | 触发：演示文稿QA，不要求重新生成内容 |
| N1 | 做一张带二维码的活动海报，不要演示文稿。 | 不触发：QR关键词不覆盖明确海报意图 |
| N2 | Edit this PDF contract only; do not create a presentation. | 不触发：仅PDF合同编辑 |
| N3 | Explain how a CSS slide transition works on a website. | 不触发：slide词出现不代表演示文稿任务 |

结果：六项规则人工走查均与入口描述吻合，新增脚本的六项意图标签契约断言通过。**没有启动实际模型/skill选择器做盲测**；这些不是模型自动触发准确率测量，不应将6/6解释为生产路由效果。

## 一次工作流走查（经营复盘，无需生成实际deck）

输入采用playbook案例1的定性材料，额外工作假设为“管理者会议、演讲、8页上限”，不引入任何真实公司数字。

1. 路由B；先核对受众和用途，保留收入拆分未核、成本口径变更、回款逾期、会议分配责任四点；附件未核实明确记缺口。
2. 决策单写“先确认口径，再分配跟进责任”，信息关系为状态/待核/行动，不把三主题虚构成三项增长成果。
3. 选择10×5.625、18pt正文、30pt页标题、中性底色+单强调色、editorial-grid；最密页使用原生表格文字/线条，不虚构API字段。
4. 页计划：封面；口径/状态证据表；责任与下一步。页数是上限不是必须凑满8页。证据表同时是最密页，代表页只需封面+表格两页。
5. 默认在这两页呈现后等一次方向确认再展开；这次是文档走查，未制作代表页、未获得用户方向批准，不冒称已展开/验收。若用户明确直做，记录豁免而非每步审批。
6. 没有财务确认数据时不调用metrics、不画数值柱图；数据补齐且符合API约束后再映射已有metrics。无信息用途的图像不生成。
7. 后续执行清单：四类技术QA → 实际字体/渲染单页与总览 → 修复复查 → 用户事实/风格审阅；QR仅需求存在时增加编码/扫码。PPTX与Markdown同步更新。

走查结论：新文档能将含糊的“三卡片”问题转换为证据状态和决策构图，且暴露证据缺口。未生成PPT、未运行视觉验收，不能据此声称审美已被机器证明。

## 补丁应用与源码使用

补丁包含新增文件（不是仅 `git diff` 的已跟踪部分）。先备份本地修改，并在目标仓库核对基线；以下命令不产生commit：

```bash
git rev-parse HEAD
git status --short
git apply --check /absolute/path/slide-recipes-aesthetic.patch
git apply /absolute/path/slide-recipes-aesthetic.patch
npm ci
node scripts/aesthetic-docs-test.mjs
npm test
```

若基线不同或已有冲突，先人工合并，勿强行覆盖。源码ZIP顶层为 `slide-recipes/`，包含原仓库必要源码、资源、示例与新增文档；排除.git、node_modules、临时测试输出及实际秘密。保留仓库跟踪的无真实凭据 `web/.env.example` 作为安装示例。两种交付内容相同，不要在已修改源码上重复应用补丁。

## 限制

- 未触碰brief中的/tmp克隆，不能继承其未提交修改；以报告基线为准。
- 完整npm test未全部绿：provider隔离安装测试受Electron环境阻碍，需标准Node复测。原测试断言与安装兼容覆盖均未删除。
- 未运行web build/web独立测试：此次未修改web程序。未调用付费生图服务、未生成真实幻灯片、未做字体跨设备或二维码实扫、未进行LibreOffice视觉验收。
- 原recipe的固定字号、数据标签、布局与旧契约仍保持实现兼容；文档升级不会自动改变旧deck或Web Studio UI。审美提升需真实内容、代表页和人工审阅进一步验证。
- 没有新增市场认证、模型触发实测或主观审美机器认证。

## 交付验证

打包脚本对基线补丁可应用性、应用后文件一致性以及ZIP完整性进行断言；仅在全部通过后才输出本报告对应交付物。详细数量在交付时的工具结果记录。
