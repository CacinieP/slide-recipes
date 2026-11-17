# Slide Recipes

**在线入口**

- [🇨🇳 国内 EdgeOne](https://slides.linguistwantstech.online/)
- [🌍 全球 Vercel](https://slide-recipes-web.vercel.app/)

[`slide-recipes`](https://github.com/CacinieP/slide-recipes/) skill 的本地可视化入口:在浏览器里填表单,本机用 PptxGenJS 按 skill 的设计系统生成真正的 `.pptx` 文件。

当前版本使用用户填写的模型 API Key，**Key 只留在浏览器内存，绝不写入 localStorage 或上报**。提供两种显式请求模式：代理模式经本站 `/api/proxy` 内存转发（解决 CORS，部署为在线服务时请求经过本站服务器）；直连模式由浏览器直接访问供应商（不经任何中间服务器，受供应商 CORS 策略限制）。网络失败不会自动切换模式。

当前版本尚未实现网站统一模型、注册名额或每日生成额度。公开部署前必须配置共享限流；安全策略见 [`docs/PROXY_SECURITY.md`](./docs/PROXY_SECURITY.md)。

## 它做什么

```
主题 / 普通文本 / Markdown + 配置 → AI 大纲 → 自由编辑 → 下载 .pptx + .md
```

LLM 被约束成必须输出一份大纲，**每页只能是 27 种页面类型之一**——基础 5 类 `cover` / `toc` / `section` / `content` / `summary`，加 22 种商业/分析版式（kpiDashboard、funnel、gantt、swot、marketSize、faq 等），并强制结构规则（首页必封面、末页必收尾）。默认 `MiniCPM-V-4.7-35B-A3B` 走完整 schema；低成本 `MiniCPM-V-4.7-1B` 走固定平铺模板，正文含明确阶段/数字信号时确定性地推断为 processFlow / statCallout（每份最多 2 页），并对字符串内裸换行、多余尾括号做本地修复，封面副标题/收尾行动限长防溢出。校验失败时自动容错自愈（未知类型归一为 content、补齐首尾页）。渲染器再把每种类型映射成具体的 PptxGenJS 布局，严格遵循 skill 的设计规范。

产出可编辑的 **`.pptx`** 和配套 **`.md` 大纲**。修改大纲后重新导出不再次调用模型。已在 Keynote 核验 PPTX 的可编辑文本。

## 内置的设计系统(来自 skill)

| 维度 | 选项 |
|---|---|
| **27 种页面类型** | 基础 5 类 + 22 种商业/分析版式（KPI、漏斗、甘特、SWOT、市场规模、FAQ…） |
| **57 个调色板** | 39 套商业语义配色 + 18 套灵感配色；每个 5 色 `{primary, secondary, accent, light, bg}` 主题，支持色环自定义 |
| **15 类演示场景** | 场景预设联动语气/色板/风格/字体 |
| **8 种字体配对** | Georgia/Calibri、Arial Black/Arial、… |
| **4 种风格** | Sharp · Soft · Rounded · Pill(控制圆角和间距) |
| **页码徽标** | 圆形或胶囊,除封面外每页必加(`x:9.3 y:5.1`) |

## 快速开始

```bash
npm ci
npm run dev                  # 打开 http://localhost:3000，填写自己的模型 Key
```

### 环境变量

模型 Key 目前来自浏览器配置表单，不读取旧文档中的 `OPENAI_API_KEY`。生产代理所需的服务端环境变量如下：

| 变量 | 必填 | 默认值 | 说明 |
|---|:---:|---|---|
| `UPSTASH_REDIS_REST_URL` | 生产必填 | — | 官方 Upstash Redis HTTPS REST 地址 |
| `UPSTASH_REDIS_REST_TOKEN` | 生产必填 | — | 服务端 Redis 凭证，不暴露给浏览器 |
| `MODELBEST_API_KEY` | 当前代理不使用 | — | 后续账号版统一模型的服务端 Key，仅配置准备模块使用 |

完整配置及当前限制见 [`docs/ENV.md`](./docs/ENV.md)。共享限流缺配置或不可用时，生产代理返回 503，不向模型上游发请求。

已选定网站默认模型 `MiniCPM-V-4.7-35B-A3B`（MoE，3B 激活，走完整 27 类型设计系统），固定 ModelBest 接口；同 Key 可选低成本 `MiniCPM-V-4.7-1B`（平铺模板 + 版式推断）。配置准备和未启用的功能边界见 [`docs/MODEL_CONFIG.md`](./docs/MODEL_CONFIG.md)。

## 预览原理

模型返回 JSON（代理或直连）；客户端校验结构化大纲（自定义 JSON 输入走同一套校验/自愈），并使用 PptxGenJS 生成 PPTX Blob 和下载链接。预览和文件导出使用同一份大纲，不需要第二次调 LLM。请求默认 120 秒超时，可随时取消；Ctrl/Cmd+Enter 快捷生成。当前没有 `/api/generate` 路由。

## 技术栈

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · PptxGenJS

## 设计语言

「Proof Studio」暖纸浅色编辑风：纸白底 + 墨色 + 群青主色/朱红显示色，衬线编号与发丝线分节，零 emoji，自绘线性图标。用 `npx designlang` 从 pitch.com 与 linear.app 提取设计语言研究后融合；关键文本对比度均 ≥4.5:1，动效尊重 prefers-reduced-motion。首次访问可用「载入示例」无 Key 体验完整导出流程。

## 项目结构

```
src/
├── app/
│   ├── api/proxy/route.ts      # 受限模型代理：目标校验、共享限流、大小与超时限制
│   ├── layout.tsx · globals.css · icon.svg
│   └── page.tsx                # 配置表单 + 预览 + 下载（取消/超时/快捷键）
├── lib/
│   ├── types.ts                # SLIDE_TYPES 单一事实来源, Theme, DeckPlan, …
│   ├── palettes.ts             # 57 调色板 + 字体 + 风格 metrics + 场景预设
│   ├── prompt.ts               # 27 类型约束 prompt + 大纲校验/自愈/精简
│   ├── render.ts               # PptxGenJS 渲染器(27 类型分派 + 徽标)
│   ├── client-generator.ts     # 请求传输（代理/直连、超时、取消）
│   ├── model-config-storage.ts # 配置持久化（API Key 绝不落盘）
│   └── outline-markdown.ts     # 大纲 → Markdown 导出
└── components/
    ├── ConfigPanel.tsx · PalettePicker.tsx · ColorWheel.tsx
    └── PreviewPanel.tsx · OutlineEditor.tsx · DownloadCard.tsx
```

## 静态站与请求模式

Vercel 默认使用同源 /api/proxy。界面提供明确的代理／直连选择，模型检测与大纲生成使用同一配置，网络失败不会切换方式或自动重发。代理模式下 Key 经过自己的部署服务。

GitHub Pages 使用 npm run build:pages 并发布 out；默认直连受供应商 CORS 策略限制。外部代理通过 NEXT_PUBLIC_MODEL_PROXY_URL 显式配置，须自行允许静态站来源。详见 docs/ENV.md。
