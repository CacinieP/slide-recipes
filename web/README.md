# Slide Recipes

[`slide-recipes`](https://github.com/CacinieP/slide-recipes/) skill 的本地可视化入口:在浏览器里填表单,本机用 PptxGenJS 按 skill 的设计系统生成真正的 `.pptx` 文件。

当前版本使用用户填写的模型 API Key。浏览器经本站 `/api/proxy` 调用批准的模型服务，随后在浏览器生成、预览和下载 PPTX。部署为在线服务时，Key 和模型请求会经过本站服务器。

当前版本尚未实现网站统一模型、注册名额或每日生成额度。公开部署前必须配置共享限流；安全策略见 [`docs/PROXY_SECURITY.md`](./docs/PROXY_SECURITY.md)。

## 它做什么

```
主题 / 普通文本 / Markdown + 配置 → AI 大纲 → 自由编辑 → 下载 .pptx + .md
```

LLM 被约束成必须输出一份大纲,**每页只能是 5 种页面类型之一**——`cover` / `toc` / `section` / `content` / `summary`,并强制结构规则(首页必封面、末页必总结、布局不连续重复)。渲染器再把每种类型映射成具体的 PptxGenJS 布局,严格遵循 skill 的设计规范。

产出可编辑的 **`.pptx`** 和配套 **`.md` 大纲**。修改大纲后重新导出不再次调用模型。已在 Keynote 核验 PPTX 的可编辑文本。

## 内置的设计系统(来自 skill)

| 维度 | 选项 |
|---|---|
| **5 种页面类型** | cover · toc · section · content · summary |
| **18 个调色板** | 每个 5 色 `{primary, secondary, accent, light, bg}` 主题 |
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

已选定网站模型 `MiniCPM-V-4.7-1B`，固定 ModelBest 接口。配置准备和未启用的功能边界见 [`docs/MODEL_CONFIG.md`](./docs/MODEL_CONFIG.md)。

## 预览原理

`/api/proxy` 返回模型 JSON；客户端校验结构化大纲，并使用 PptxGenJS 生成 PPTX Blob 和下载链接。预览和文件导出使用同一份大纲，不需要第二次调 LLM。当前没有 `/api/generate` 路由。

## 技术栈

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · PptxGenJS

## 项目结构

```
src/
├── app/
│   ├── api/proxy/route.ts      # 受限模型代理：目标校验、共享限流、大小与超时限制
│   ├── layout.tsx · globals.css
│   └── page.tsx                # 配置表单 + 预览 + 下载
├── lib/
│   ├── types.ts                # SlideType, Theme, DeckPlan, …
│   ├── palettes.ts             # 18 调色板 + 字体 + 风格 metrics
│   ├── prompt.ts               # 带 5 页面类型约束的 prompt + 大纲校验器
│   └── render.ts               # PptxGenJS 渲染器(5 类型分派 + 徽标)
└── components/
    ├── ConfigPanel.tsx · PalettePicker.tsx
    └── PreviewPanel.tsx · DownloadCard.tsx
```

## 静态站与请求模式

Vercel 默认使用同源 /api/proxy。界面提供明确的代理／直连选择，模型检测与大纲生成使用同一配置，网络失败不会切换方式或自动重发。代理模式下 Key 经过自己的部署服务。

GitHub Pages 使用 npm run build:pages 并发布 out；默认直连受供应商 CORS 策略限制。外部代理通过 NEXT_PUBLIC_MODEL_PROXY_URL 显式配置，须自行允许静态站来源。详见 docs/ENV.md。
