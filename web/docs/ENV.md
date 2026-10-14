# 部署与模型配置

## 当前行为

当前版本仍使用用户填写的 API Key。浏览器请求本站 `/api/proxy`，服务端将 Key 转发至用户选择的、已批准的模型服务。PPTX 的生成和下载在浏览器内完成。

当前没有 `/api/generate`，也不读取 `OPENAI_API_KEY`、`OPENAI_BASE_URL` 或 `OPENAI_MODEL`。网站统一模型、账号注册和每天 5 次额度是后续改造，尚未实现。

网站模型已选定为 `MiniCPM-V-4.7-1B`，固定 `https://api.modelbest.cn/v1`。服务端配置准备模块读取 `MODELBEST_API_KEY`，但未接入公开代理；它不能在账号鉴权与额度控制完成前用于匿名调用。详见 [MODEL_CONFIG.md](./MODEL_CONFIG.md)。

浏览器会保存模型配置（包含用户 Key）至 localStorage。不要在共享电脑上使用此功能；不要把网站统一模型的 Key 填入前端或 `NEXT_PUBLIC_*` 环境变量。

## 服务端环境变量

生产环境（`NODE_ENV=production` 或在 Vercel 运行）要求：

| 变量 | 作用 |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis 的官方 HTTPS REST 地址 |
| `UPSTASH_REDIS_REST_TOKEN` | 服务端 Redis 访问凭证 |

凭证放入平台的 Secret/Environment Variables，或者被 Git 忽略的本地 `.env.local`。禁止提交真实凭证。Redis 未配置或异常时，代理返回 503，且不会请求模型服务。仅本地开发可以使用进程内限流；它不提供跨实例保证。

## 模型服务边界

仅允许现有预设服务商的精确 HTTPS base URL，并仅开放 `GET /models` 与 `POST /chat/completions`。任意 URL 下载、图片转发、内网端点、HTTP 端点、自动重定向及流式响应均不支持。

前端填写自定义地址不能扩大服务器允许的范围。新的可信服务商需要部署者通过服务端允许列表显式批准。没有隐式浏览器直连；代理异常或拒绝不会触发第二次上游调用。

## 错误处理

| 状态 | 处理 |
|---|---|
| 400 / 403 | 检查请求格式、Key 和目标是否属于已批准端点 |
| 413 | 缩短输入；请求体超出上限 |
| 429 | 等待 `Retry-After` 后再提交，禁止立即循环重试 |
| 503 | 检查生产共享限流的配置与可用性 |
| 502 / 504 | 模型服务响应异常或超时，检查服务状态后重试 |

不要通过安装关闭浏览器跨域保护的插件绕过错误。

完整威胁边界及回归验证见 [PROXY_SECURITY.md](./PROXY_SECURITY.md)。

## Vercel 与 GitHub Pages

Vercel: Root Directory 为 web，安装 npm ci，构建 npm run build，Next.js 框架，Node 24.x。不要再次 cd web。web/vercel.json 提供根目录配置。

Pages: 在 web 执行 npm run build:pages，发布 out。默认 basePath 为 /slide-recipes，可用 PAGES_BASE_PATH 设置。默认浏览器直连，受供应商 CORS 策略限制。NEXT_PUBLIC_MODEL_PROXY_URL 可显式指定外部代理；该服务须自行配置来源访问控制。网络异常不会自动切换请求方式。

自定义供应商由部署者通过服务端 MODEL_PROXY_ALLOWED_BASE_URLS 显式批准，以逗号分隔精确 HTTPS base URL。路径、公网 DNS、重定向限制仍生效。
