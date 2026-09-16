# Codex 安装后配图与自定义 API

安装整份 `themed-cn-pptx` 技能后，生图脚本只需要 Node >=20，不依赖仓库根目录或 npm 包。
`SKILL_DIR` 指安装后的技能目录；工作目录是用户的 PPT 项目。不要修改 Codex 全局模型配置。
项目 `.env` 自动加载，shell 中已有变量优先。Key 仅置于本地环境或 `.env`，并把 `.env` 加入项目 `.gitignore`。

## 路由

- 用户选择 API/endpoint 时，使用这里的脚本。
- 用户希望用 Codex 内置生图且会话提供 imagegen 工具时，可直接用该工具，保存生成图片后交给 PptxGenJS；它不需要这套 API Key。没有工具时不能假设安装 skill 就会新增工具。
- 缺少 Key 时库返回 `null`，CLI 退出码 2；采用纯色或原生图形并明确说明图片未生成。HTTP/协议错误要报告，不伪装为成功，也不自动无限重试付费请求。

## 配置表

| provider | 协议 | Key 环境变量 | Base URL 环境变量 | Model 环境变量 |
| --- | --- | --- | --- | --- |
| openai | OpenAI images | OPENAI_API_KEY | OPENAI_BASE_URL | OPENAI_IMAGE_MODEL |
| google / nano | Gemini generateContent | GOOGLE_API_KEY 或 GEMINI_API_KEY | GOOGLE_BASE_URL | GOOGLE_IMAGE_MODEL |
| bailian / dashscope | 百炼同步 multimodal-generation | DASHSCOPE_API_KEY | DASHSCOPE_BASE_URL | DASHSCOPE_IMAGE_MODEL |
| minimax | MiniMax image_generation | MINIMAX_API_KEY | MINIMAX_BASE_URL | MINIMAX_IMAGE_MODEL |
| custom | 默认 OpenAI images，可改协议 | PPT_IMAGE_API_KEY | PPT_IMAGE_BASE_URL | PPT_IMAGE_MODEL |

`baseUrl` 包含 API 版本前缀但不含操作路径，如 `https://api.minimax.io/v1`。
百炼需填写自己工作空间与地域对应的 API 前缀，例如 `https://<WorkspaceId>.cn-beijing.maas.aliyuncs.com/api/v1`，不要照抄占位符；当前适配同步 `wan2.6-t2i`，不支持旧异步任务协议。
Google 默认保留仓库的 `gemini-3-pro-image`，请按账号可用性配置具体模型 ID（例如服务提供的 Nano Banana 变体）。

## 自定义 endpoint 示例

项目 `.env`：

```dotenv
PPT_IMAGE_PROVIDER=custom
PPT_IMAGE_API_KEY=replace-locally
PPT_IMAGE_BASE_URL=https://your-gateway.example/v1
PPT_IMAGE_MODEL=your-exact-model-id
PPT_IMAGE_PROTOCOL=openai
```

`PPT_IMAGE_ENDPOINT` 可填写完整操作 URL，优先于 Base URL 拼接。支持协议值：`openai`、`gemini`、`dashscope`、`minimax`。
模型 ID 原样传入。例如你的服务确实提供 `gpt-image-2.5`，则设置该值；这里不宣称该 ID 是官方模型或所有网关都支持。
模型品牌与协议是两件事：通过 OpenAI 网关调用 Nano 模型时选 `custom` + `openai`，直接调用 Google 则选 `google`。

`image-request.json`：

```json
{
  "prompt": "用于研究报告的抽象材料结构，冷白背景，蓝色细节，右侧主体，左侧留白，无文字无标识",
  "usage": "cover",
  "size": "1536x1024",
  "saveDir": "./assets/generated"
}
```

```bash
node "$SKILL_DIR/scripts/generate-image.mjs" --check
node "$SKILL_DIR/scripts/generate-image.mjs" image-request.json
```

`--check` 不联网、不生图、不输出 Key。生成结果含 `localPath`、`absolutePath` 与 PPT 图框信息。
`size` 是请求尺寸，返回元数据不等于测得的文件像素；布局应按实际图片使用 crop/contain，不能直接拉伸。
每个请求还可覆写 `provider`、`protocol`、`model`、`baseUrl`、`endpoint`、`timeoutMs`（默认 120 秒）与 `extraBody`。
`extraBody` 是浅合并，用于服务专属参数；不要覆盖核心字段，除非了解该协议。
显式参数优先于 provider 环境变量，环境变量优先于默认值。自定义模型不套用 GPT Image 2 的尺寸限制。
不要把 `apiKey` 写入 request JSON；JS 内存调用虽支持该参数，持久配置仍应使用环境变量。

## 官方协议参考（2026-09-16 核对）

- [Google generateContent](https://ai.google.dev/api/generate-content)
- [MiniMax 文生图](https://platform.minimax.io/docs/api-reference/image-generation-t2i)
- [百炼同步文生图](https://help.aliyun.com/en/model-studio/text-to-image-v2-api-reference)

本地 mock 测试验证请求、错误处理与文件落地；真实模型可用性、余额和地域需使用自己的服务验证。
