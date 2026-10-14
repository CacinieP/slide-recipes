# 国内 EdgeOne Pages / 海外 Vercel

两个部署使用同一个 `CacinieP/slide-recipes-web` 仓库的 `main` 分支，项目根目录均为 `web`。现有海外入口保留为 `https://slide-recipes-web.vercel.app/`；国内入口为 `https://slides.linguistwantstech.online/`。两站已完成真实模型调用、大纲编辑、PPTX 与 Markdown 导出验收；PPTX 已在 Keynote 打开并核验可编辑文本。公开主仓库 `CacinieP/slide-recipes` 同步 Web 源码，实际生产部署源仍为 `slide-recipes-web`。

## EdgeOne 构建

选择全栈 Next.js 框架，安装 `npm ci`、构建 `npm run build`、输出 `.next`，构建 Node 版本为 24.5.0。`web/edgeone.json` 声明这些配置，以及 Cloud Functions 的 120 秒超时。根目录已设为 `web` 后不能再 `cd web`。

不要使用 `BUILD_TARGET=pages` 或静态 `out` 输出；国内站也需要 Node.js 动态 `/api/proxy`，以复用 HTTPS 上游白名单、DNS 校验与连接绑定、禁止重定向、大小/超时限制及共享限流。UI 的代理模式使用当前站点的同源地址，不调用海外 Vercel。

## 服务端变量与限流

生产服务端需要 `UPSTASH_REDIS_REST_URL` 与 `UPSTASH_REDIS_REST_TOKEN`。仅在部署控制台配置为服务端密钥，不写入仓库，也不加 `NEXT_PUBLIC_` 前缀。向 EdgeOne 配置该凭据需得到部署者明确授权。用户模型 Key 由用户浏览器提交给当前部署，仅转发至批准供应商。

现有限流仅在 Vercel 信任其平台覆盖的 `x-vercel-forwarded-for`。其他运行环境把访客归入同一个保守的客户端桶，限制为 6 次模型查询/生成请求每分钟，同时保留全局 30 次/分钟。不要通过把 `VERCEL=1` 设到 EdgeOne 或盲目信任可伪造的转发头来扩大配额。若需按真实客户端分别计数，先核验 EdgeOne 的可信来源上下文并实现相应适配与测试。

必须在线测试国内函数至 Upstash 和所选模型供应商的网络连通性，不能因 Redis 网络不可用而取消限流或退回实例内计数。

## 国内域名

选择中国大陆加速区域。阿里云办理的备案应先核验其在工信部有效性，并以 EdgeOne 控制台的域名及接入要求为准。只添加 `slides` 子域名的 CNAME/TXT 验证记录，保留主域名现有记录。取得明确的 CNAME 目标后再配置 DNS。

EdgeOne 默认项目/部署链接在中国大陆区域需要 3 小时有效的预览链接，不能代替长期入口。绑定自定义域名、HTTPS 与线上模型/PPTX/Markdown 验收完成后，才更新对外链接及邮件。

## 官方依据

- [Next.js 全栈框架指南](https://cloud.tencent.com.cn/document/product/1552/127381)
- [构建 Node 版本](https://edgeone.cloud.tencent.com/pages/document/162936788693114880)
- [edgeone.json 配置](https://pages.edgeone.ai/document/edgeone-json)
- [域名与国内预览链接限制](https://edgeone.cloud.tencent.com/pages/document/175191784523485184)
- [中国站免费套餐说明](https://edgeone.cloud.tencent.com/pages/document/162936949996421120)
