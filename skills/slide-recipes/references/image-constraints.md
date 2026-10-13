# Image Generation Constraints & Prompt Schema

Use this reference before calling `generateSlideImage()`. The image model should create visual assets, not slide layout.

## 1. 结构化生图 Prompt Schema

为保证全套 PPT 的配图风格统一、并为文字保留准确的留白区域，系统提供标准化的 `ImagePromptSchema`。可在 `generateSlideImage({ imagePrompt: schema })` 或 Slide JSON 中直接声明：

```json
{
  "subject": "translucent geometric crystal prisms refracting soft data rays",
  "stylePreset": "editorial-minimal",
  "medium": "editorial architectural 3D render",
  "composition": "dynamic off-center arrangement placed on the right half",
  "negativeSpace": "left-50",
  "palette": ["#123936", "#28664D", "#D8F0A3"],
  "colorMood": "cool forest green and warm sandstone ambient gradient",
  "lighting": "soft diffused directional studio light with gentle ambient shadow",
  "materials": ["frosted glass", "matte ceramic", "brushed aluminum"],
  "usage": "cover",
  "allowText": false
}
```

### 核心字段规范

| 字段 | 类型 | 说明与规范 |
|---|---|---|
| `subject` | `string` *(必填)* | 核心主体视觉描述，聚焦物体、概念或场景，而非整页幻灯片。 |
| `stylePreset` | `string` | 预设风格：`editorial-minimal`、`corporate-clean`、`tech-futuristic`、`studio-monochrome`、`warm-education`。 |
| `medium` | `string` | 视觉媒介：如 `3D render`、`studio photography`、`isometric illustration`。 |
| `composition` | `string` | 构图景别：如 `rule-of-thirds`、`isometric perspective`、`close-up macro`。 |
| `negativeSpace` | `string` | **排版安全区（留白）**：`left-50`（左半留白）、`right-50`、`top-40`、`bottom-40`、`surrounding`。 |
| `palette` | `string[]` | 幻灯片色板 HEX 数组，引导图像与 PPT 主题色系严密呼应。 |
| `colorMood` | `string` | 光影色调氛围描述，如 `"deep navy with frost cyan accents"`。 |
| `lighting` | `string` | 光照特征：如 `"soft diffused daylight"`、`"rim lighting with dark backdrop"`。 |
| `materials` | `string[]` | 材质触感：如 `["matte clay", "frosted glass", "smooth aluminium"]`。 |
| `usage` | `string` | 版式槽位（见下表），自动推导建议宽高比与像素。 |
| `allowText` | `boolean` | **严格禁字约束**，默认 `false`。严禁在画面中生成任何文字或伪 UI。 |
| `avoidConcepts`| `string[]` | 商业负面回避词，如 `["hallucinated text", "distorted faces", "fake logos"]`。 |

---

## 2. 编译为原生提示词

通过 `compileImagePrompt(schema)` 自动将结构化 Schema 编译为大模型正向与负向提示词：

```js
import { compileImagePrompt } from '../lib/image-prompt-schema.js';

const { prompt, negativePrompt, usage, aspectRatio } = compileImagePrompt({
  subject: 'interconnected nodes floating in architectural balance',
  stylePreset: 'corporate-clean',
  negativeSpace: 'left-50',
  palette: ['142B40', '006F73'],
  usage: 'cover'
});
```

编译出的 Prompt 自动强化留白与禁字指令：
> `A high-end studio photography depicting interconnected nodes floating in architectural balance. Composition: authoritative, organized balance. Layout requirement: clean uncluttered empty negative space on the left 50% for typography overlay. Color palette: harmonized tones of #142B40, #006F73. STRICT REQUIREMENT: Absolutely NO text, NO words, NO letters, NO numbers, NO watermark, NO logo.`

---

## 3. Usage 槽位与尺寸映射

| Usage | 需求场景 | GPT Image 2 | Nano Banana Pro | 默认安全区 |
|---|---|---|---|---|
| `cover` | 全幅幻灯片封面 | `1360x768` (16:9) | `16:9 + 2K` | `left-50`（左侧标题安全区） |
| `coverOverlay` | 带文字叠加的背景 | `1360x768` (16:9) | `16:9 + 2K` | 叠加 40-55% 遮罩层 |
| `hero` | 顶部宽幅横幅 | `1360x768` (16:9) | `16:9 + 2K` | 建议留白 35% |
| `bannerWide` | 21:9 超宽横条 | `1344x576` (21:9) | `21:9 + 2K` | 两端留白 |
| `ultraWideHero`| 宽幅标题配图 | `1344x576` (21:9) | `21:9 + 2K` | 保持标题侧纯净 |
| `sideStrip` | 侧栏纵向画带 | `768x1360` (9:16) | `9:16 + 2K` | 边缘无裁切主体 |
| `card` | 1:1 正方形卡片配图 | `1024x1024` (1:1) | `1:1 + 1K` | 主体居中，周围留白 |
| `cardTall` | 3:4 竖版卡片配图 | `896x1184` (3:4) | `3:4 + 1K` | 适合流程/人物概念图 |
| `cardWide` | 4:3 横版卡片配图 | `1184x896` (4:3) | `4:3 + 1K` | 适合产品概览 |
| `showcase` | 产品/成果展示画廊 | `1184x896` (4:3) | `4:3 + 2K` | 无虚假 UI 边框 |
| `phoneMockup` | 移动端概念展示 | `768x1360` (9:16) | `9:16 + 1K` | 优先真实截图，非则纯概念 |
| `icon` | 独立几何示意图标 | `1024x1024` (1:1) | `1:1 + 1K` | 极简剪影，无细碎杂点 |

---

## 4. 商业提示词负向底线 (Negative Defaults)

```text
text, typography, letters, words, slide title, watermark, logo, barcode, QR code, fake UI chrome, buttons, chart labels, messy details, low resolution, blurry, distorted geometry, extra fingers, noisy background
```

- **严禁文字**：所有正式文字、数据指标、图表必须由 PPTX 原生形状和文本框提供，绝对不能在生图中印制不可编辑文字。
- **一致性**：整套演示文稿所有配图必须复用相同的 `stylePreset`、`lighting` 与 `materials`，避免不同页面画风割裂。
