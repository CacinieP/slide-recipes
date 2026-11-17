# Changelog / 更新日志

## 2026-11-17 — Web Studio 前端与 skill 工具链优化（issue #13）

### Fixed / 修复

- **安全**：Next.js 16.4.0 → 16.4.6（同系列补丁版）。旧版命中已知安全公告，`npm run build` 被 `SecurityFatalError` 直接阻断；同步升级 eslint-config-next 并改用原生 flat config（旧 FlatCompat 写法在 16.x 下循环引用报错）。
- **隐私一致性**：UI 承诺「API Key 只留内存」，但旧代码把含 apiKey 的完整配置写入 localStorage。新增 `model-config-storage.ts` 单一持久化入口：Key 绝不落盘，加载时自动清洗历史遗留 Key；非敏感配置照常持久化。
- **请求健壮性**：模型请求新增 120 秒默认超时与用户取消（生成中显示「取消」按钮），超时/取消/网络失败提示可区分；新增 Ctrl/Cmd+Enter 快捷生成。
- **自定义 JSON 大纲**：改走与 AI 路径同源的校验/自愈（`parseCustomOutlineJson`），未知类型归一为 content、首尾页自动矫正，不再把非法页直接送进渲染器。
- **可访问性**：按钮/链接恢复 focus-visible 金色焦点环；Base URL/API Key/模型下拉补齐 aria-label；切换类按钮补 aria-pressed/aria-expanded；`--text-mute` #71717A→#8A8A8A（10px 小字对比度 4.10:1→5.73:1，用 skill 自带 color-qa 验证）。
- **类型一致性**：`SLIDE_TYPES` 常量数组成为单一事实来源（27 种）；header 计数动态化；`PreviewPanel.TYPE_META` 改为穷举 Record，补齐 marketSize/faq 预览标签；prompt 内两处重复类型白名单收敛。

### Added / 新增

- 新增 20 项 web 回归测试（存储隐私 8 / 请求生命周期 6 / 自定义 JSON 6），总计 154 项。
- `validate-skills.mjs` 增强：name 与目录一致、description ≤1024、SKILL.cn.md 镜像存在、双语 manifest 相对链接可达；支持 fixture root 参数，新增 9 项 fixture 测试并接入 npm test 与 CI。
- SKILL.md / SKILL.cn.md §6 补 Web Studio 仓库与国内/全球双节点链接。
- 新增 favicon（icon.svg）、Open Graph/twitter 元数据、themeColor；header 窄屏允许换行。
- web-security CI 新增 lint 门禁（0 error；3 项历史 `any` 债务记为 warning 待后续类型化）。

### Docs / 文档

- web/README.md 按现状重写：27 页面类型 / 57 色板 / 15 场景 / 双请求模式 / Key 内存-only / 超时与取消。

## 2026-11-11 — Muted editorial & heritage palettes / 低饱和编辑风与传统配色

### Added / 新增

- Added 11 business palettes: `clay-sunrise`, `pine-paper`, `xuan-cinnabar`, `crimson-scholar`, `deep-harbor`, `harbor-mist`, `sage-brush`, `plum-noir`, `oat-taupe`, `olive-rust`, and `slate-drizzle`. The Skill catalog now contains 39 semantic palettes.
- Added the same 11 presets to the Web palette picker, preview and PPTX export through the existing five-role mapping: `ink → primary`, `muted → secondary`, `accent → accent`, `highlight → light`, `paper → bg`. Web retains 18 existing inspiration palettes, for 57 presets total. The Web mapping does not expose the Skill’s separate `dark`, `light` and `line` roles.
- Added 55 contrast QA pairs and documented palette distillation and provenance. All 39 Skill palettes pass the runtime seven-pair 4.5:1 contrast gate.

### Fixed / 修复

- Regenerated the palette gallery and catalog so `plum-noir.light` matches the calibrated source value `F5F2F5`; the previous documented value `F3EEF2` failed the `light/accent` contrast gate.
- Gallery canvas dimensions and preset counts now derive from the palette list, avoiding clipped rows and stale labels.
- Updated Web documentation to distinguish 39 business palettes from 57 total presets. The public repository’s Web headline derives its count from the palette list.

### Deployment / 部署

- China: https://slides.linguistwantstech.online/ (EdgeOne Pages).
- Global: https://slide-recipes-web.vercel.app/ (Vercel).
- Both production sites build from `CacinieP/slide-recipes-web`, branch `main`, project root `web`. Web palette updates are synchronized separately from the public Skill repository. Each deployment keeps its existing UI and model proxy configuration.
