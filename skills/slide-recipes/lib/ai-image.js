/** PPT image generation: OpenAI-compatible, Gemini, DashScope sync and MiniMax.
 * Configuration and installed CLI: ../references/image-providers.md.
 * Model IDs are provider-specific; custom model parameters pass through.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve, join, isAbsolute } from "node:path";

// ---------------------------------------------------------------------------
// .env auto-loader (runs once on import, zero dependencies)
// ---------------------------------------------------------------------------
{
  const envPath = resolve(process.cwd(), ".env");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // process.env already set by shell, MCP, or CI takes precedence.
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env not found is fine. Rely on process.env from shell / MCP / CI.
  }
}

// ---------------------------------------------------------------------------
// Provider metadata
// ---------------------------------------------------------------------------
export const IMAGE_PROVIDERS = {
  openai: {
    id: "openai",
    label: "OpenAI GPT Image 2",
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
    modelEnv: "OPENAI_IMAGE_MODEL",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-image-2",
    defaultSaveDir: "./assets/gpt-image",
    auth: "bearer",
    maxN: 4,
  },
  google: {
    id: "google",
    label: "Google Nano Banana Pro (Gemini 3 Pro Image)",
    apiKeyEnv: "GOOGLE_API_KEY",
    apiKeyFallbackEnvs: ["GEMINI_API_KEY"],
    baseUrlEnv: "GOOGLE_BASE_URL",
    modelEnv: "GOOGLE_IMAGE_MODEL",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-3-pro-image",
    defaultSaveDir: "./assets/nano-banana",
    auth: "x-goog-api-key",
    maxN: 4,
  },
};

Object.assign(IMAGE_PROVIDERS, {
  custom: { id: "custom", label: "OpenAI-compatible endpoint", apiKeyEnv: "PPT_IMAGE_API_KEY",
    baseUrlEnv: "PPT_IMAGE_BASE_URL", modelEnv: "PPT_IMAGE_MODEL", defaultBaseUrl: "",
    defaultModel: "", defaultSaveDir: "./assets/custom", auth: "bearer", maxN: 4 },
  bailian: { id: "bailian", label: "Alibaba Cloud Model Studio", apiKeyEnv: "DASHSCOPE_API_KEY",
    baseUrlEnv: "DASHSCOPE_BASE_URL", modelEnv: "DASHSCOPE_IMAGE_MODEL", defaultBaseUrl: "",
    defaultModel: "wan2.6-t2i", defaultSaveDir: "./assets/bailian", auth: "bearer", maxN: 4 },
  minimax: { id: "minimax", label: "MiniMax", apiKeyEnv: "MINIMAX_API_KEY",
    baseUrlEnv: "MINIMAX_BASE_URL", modelEnv: "MINIMAX_IMAGE_MODEL", defaultBaseUrl: "https://api.minimax.io/v1",
    defaultModel: "image-01", defaultSaveDir: "./assets/minimax", auth: "bearer", maxN: 4 },
});

export const SUPPORTED_IMAGE_PROVIDERS = Object.keys(IMAGE_PROVIDERS);

// ---------------------------------------------------------------------------
// Size mapping: PPT usage -> provider request shape + PptxGenJS layout
//
// PPT slide: 10" x 5.625" (16:9), so generated image aspect ratio matters.
// The top-level size/aspectRatio/pptxLayout contract is UNCHANGED from the
// StepFun/MiniMax era so existing decks keep their layout slots:
//   cover/hero -> 1360x768 (16:9), showcase/cardWide -> 1184x896 (4:3),
//   phoneMockup/sideStrip -> 768x1360 (9:16), cardTall -> 896x1184 (3:4).
//
// Provider adaptation (尺寸适配传参):
// - OpenAI gpt-image-2 takes a concrete `size` string. Every SIZE_MAP size is
//   directly valid under its constraints (both edges multiples of 16, max
//   edge 3840, long:short <= 3:1, total pixels in [655_360, 8_294_400])
//   EXCEPT icon 512x512 (below the min pixel count -> snap to 1024x1024) and
//   the 21:9 banners (generate native 1344x576 instead of cropping 16:9).
// - Google Nano Banana Pro takes `aspect_ratio` + `image_size` in
//   response_format. All ratios used here (16:9, 21:9, 9:16, 1:1, 3:4, 4:3)
//   are natively supported; image_size picks 1K for card/icon slots and 2K
//   for full-bleed/hero/strip slots.
// ---------------------------------------------------------------------------
export const SIZE_MAP = {
  // --- Full-bleed backgrounds ---
  cover: {
    size: "1360x768",
    aspectRatio: "16:9",
    model: "gpt-image-2",
    providers: {
      openai: { size: "1360x768", model: "gpt-image-2" },
      google: { aspectRatio: "16:9", imageSize: "2K", model: "gemini-3-pro-image" },
    },
    description: "封面全幅背景图，16:9 精确匹配幻灯片 (10x5.625 in)",
    pptxLayout: { w: 10, h: 5.625 },
  },
  coverOverlay: {
    size: "1360x768",
    aspectRatio: "16:9",
    model: "gpt-image-2",
    providers: {
      openai: { size: "1360x768", model: "gpt-image-2" },
      google: { aspectRatio: "16:9", imageSize: "2K", model: "gemini-3-pro-image" },
    },
    description: "封面背景图，需半透明遮罩配文字",
    pptxLayout: { w: 10, h: 5.625 },
  },
  // --- Banners & hero ---
  hero: {
    size: "1360x768",
    aspectRatio: "16:9",
    model: "gpt-image-2",
    providers: {
      openai: { size: "1360x768", model: "gpt-image-2" },
      google: { aspectRatio: "16:9", imageSize: "2K", model: "gemini-3-pro-image" },
    },
    description: "Hero banner，页面上半区横幅，16:9 裁切为约 10x3 in",
    pptxLayout: { w: 10, h: 3.0 },
  },
  bannerWide: {
    size: "1360x768",
    aspectRatio: "21:9",
    model: "gpt-image-2",
    providers: {
      // 21:9 is within gpt-image-2's 3:1 ratio cap, so generate natively at
      // 1344x576 (774,144 px >= 655,360 min) instead of cropping a 16:9 asset.
      openai: { size: "1344x576", model: "gpt-image-2", cropPolicy: "fit" },
      google: { aspectRatio: "21:9", imageSize: "2K", model: "gemini-3-pro-image", cropPolicy: "fit" },
    },
    description: "超宽横幅，原生 21:9 生成，无需裁切",
    pptxLayout: { w: 10, h: 2.45 },
    safeZone: "center 80% width, middle 60% height",
    cropPolicy: "crop-from-16:9-center-safe",
  },
  ultraWideHero: {
    size: "1360x768",
    aspectRatio: "21:9",
    model: "gpt-image-2",
    providers: {
      openai: { size: "1344x576", model: "gpt-image-2", cropPolicy: "fit" },
      google: { aspectRatio: "21:9", imageSize: "2K", model: "gemini-3-pro-image", cropPolicy: "fit" },
    },
    description: "超宽首页/章节视觉，原生 21:9，保留左侧标题安全区",
    pptxLayout: { w: 10, h: 2.8 },
    safeZone: "left 45% title-safe, avoid text/logos in image",
    cropPolicy: "crop-from-16:9-title-safe-left",
  },
  sideStrip: {
    size: "768x1360",
    aspectRatio: "9:16",
    model: "gpt-image-2",
    providers: {
      openai: { size: "768x1360", model: "gpt-image-2" },
      google: { aspectRatio: "9:16", imageSize: "2K", model: "gemini-3-pro-image" },
    },
    description: "竖向侧栏装饰图，9:16 竖版，右侧约 2.5 in 宽",
    pptxLayout: { w: 2.5, h: 4.44 },
  },
  // --- Cards & inline images ---
  card: {
    size: "1024x1024",
    aspectRatio: "1:1",
    model: "gpt-image-2",
    providers: {
      openai: { size: "1024x1024", model: "gpt-image-2" },
      google: { aspectRatio: "1:1", imageSize: "1K", model: "gemini-3-pro-image" },
    },
    description: "卡片方形配图，适合内容页卡片内嵌",
    pptxLayout: { w: 2.5, h: 2.5 },
  },
  cardTall: {
    size: "896x1184",
    aspectRatio: "3:4",
    model: "gpt-image-2",
    providers: {
      openai: { size: "896x1184", model: "gpt-image-2" },
      google: { aspectRatio: "3:4", imageSize: "1K", model: "gemini-3-pro-image" },
    },
    description: "卡片竖版配图，3:4 比例，适合侧栏或高卡片",
    pptxLayout: { w: 2.3, h: 3.04 },
  },
  cardWide: {
    size: "1184x896",
    aspectRatio: "4:3",
    model: "gpt-image-2",
    providers: {
      openai: { size: "1184x896", model: "gpt-image-2" },
      google: { aspectRatio: "4:3", imageSize: "1K", model: "gemini-3-pro-image" },
    },
    description: "卡片横版配图，4:3 比例，适合项目展示左图右文",
    pptxLayout: { w: 3.5, h: 2.65 },
  },
  // --- Showcase & mockup ---
  showcase: {
    size: "1184x896",
    aspectRatio: "4:3",
    model: "gpt-image-2",
    providers: {
      openai: { size: "1184x896", model: "gpt-image-2" },
      google: { aspectRatio: "4:3", imageSize: "2K", model: "gemini-3-pro-image" },
    },
    description: "项目展示横版配图，4:3 比例，左图右文布局",
    pptxLayout: { w: 3.9, h: 2.95 },
  },
  phoneMockup: {
    size: "768x1360",
    aspectRatio: "9:16",
    model: "gpt-image-2",
    providers: {
      openai: { size: "768x1360", model: "gpt-image-2" },
      google: { aspectRatio: "9:16", imageSize: "1K", model: "gemini-3-pro-image" },
    },
    description: "手机竖屏 mockup，9:16 比例",
    pptxLayout: { w: 1.8, h: 3.2 },
  },
  // --- Small ---
  icon: {
    size: "512x512",
    aspectRatio: "1:1",
    model: "gpt-image-2",
    providers: {
      // 512x512 = 262,144 px is below gpt-image-2's 655,360 px minimum, so
      // the adapter snaps up to 1024x1024 (same 1:1 ratio); Nano Banana Pro
      // has no sub-1K output, so 1K is also its floor here.
      openai: { size: "1024x1024", model: "gpt-image-2" },
      google: { aspectRatio: "1:1", imageSize: "1K", model: "gemini-3-pro-image" },
    },
    description: "小图标/占位图，适合功能图标或头像",
    pptxLayout: { w: 1.5, h: 1.5 },
  },
};

// ---------------------------------------------------------------------------
// Supported models, sizes, and provider-side size adaptation
// ---------------------------------------------------------------------------
// gpt-image-2 accepts any resolution that satisfies ALL of:
//   - both edges are multiples of 16 px
//   - max edge length <= 3840 px
//   - long-edge : short-edge ratio <= 3:1
//   - total pixels in [655_360, 8_294_400]
// Source: https://developers.openai.com/api/docs/guides/image-generation
export const GPT_IMAGE_SIZE_CONSTRAINTS = {
  multipleOf: 16,
  maxEdge: 3840,
  maxAspectRatio: 3,
  minPixels: 655360,
  maxPixels: 8294400,
};

// gemini-3-pro-image (Nano Banana Pro) accepts these aspect_ratio /
// image_size values in response_format. "K" must be uppercase.
// Source: https://ai.google.dev/gemini-api/docs/image-generation
export const GEMINI_IMAGE_ASPECT_RATIOS = [
  "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9",
];
export const GEMINI_IMAGE_SIZES = ["1K", "2K", "4K"];

/**
 * Adapt an arbitrary "<W>x<H>" request to gpt-image-2's size constraints,
 * keeping the aspect ratio as close as possible:
 * edges snapped to multiples of 16, edge clamped to 3840, ratio clamped to
 * 3:1, then scaled up/down to satisfy the min/max total-pixel bounds.
 */
export function adaptSizeForGptImage(size) {
  const match = String(size || "").match(/^(\d+)x(\d+)$/);
  if (!match) return "1024x1024";

  const c = GPT_IMAGE_SIZE_CONSTRAINTS;
  let width = snapToMultiple(Number.parseInt(match[1], 10), c.multipleOf);
  let height = snapToMultiple(Number.parseInt(match[2], 10), c.multipleOf);

  // Clamp the long edge first so the ratio cap is checkable afterwards.
  const longEdge = Math.max(width, height);
  if (longEdge > c.maxEdge) {
    const scale = c.maxEdge / longEdge;
    width = snapToMultiple(width * scale, c.multipleOf);
    height = snapToMultiple(height * scale, c.multipleOf);
  }

  // Clamp long:short to <= 3:1 by growing the short edge.
  if (height / width > c.maxAspectRatio) {
    height = snapToMultiple(width * c.maxAspectRatio, c.multipleOf);
  } else if (width / height > c.maxAspectRatio) {
    width = snapToMultiple(height * c.maxAspectRatio, c.multipleOf);
  }

  // Scale to satisfy the total-pixel window, preserving the ratio.
  const pixels = width * height;
  if (pixels < c.minPixels) {
    const scale = Math.sqrt(c.minPixels / pixels) * 1.001;
    width = snapToMultiple(width * scale, c.multipleOf);
    height = snapToMultiple(height * scale, c.multipleOf);
  } else if (pixels > c.maxPixels) {
    const scale = Math.sqrt(c.maxPixels / pixels) * 0.999;
    width = snapToMultiple(width * scale, c.multipleOf);
    height = snapToMultiple(height * scale, c.multipleOf);
  }

  return `${width}x${height}`;
}

/**
 * Adapt an arbitrary aspect ratio to the nearest ratio Nano Banana Pro
 * supports, comparing by numeric width/height value.
 */
export function adaptAspectRatioForGemini(aspectRatio) {
  if (GEMINI_IMAGE_ASPECT_RATIOS.includes(aspectRatio)) return aspectRatio;

  const target = parseAspectRatio(aspectRatio);
  if (target === null) return "1:1";

  let best = GEMINI_IMAGE_ASPECT_RATIOS[0];
  let bestDistance = Infinity;
  for (const candidate of GEMINI_IMAGE_ASPECT_RATIOS) {
    const distance = Math.abs(parseAspectRatio(candidate) - target);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

export function getImageUsageConfig(usage = "card", providerInput = "openai") {
  const provider = resolveImageProvider(providerInput);
  const sizeConfig = SIZE_MAP[usage] || SIZE_MAP.card;
  const providerSpec = sizeConfig.providers[provider] || {};

  return {
    usage: SIZE_MAP[usage] ? usage : "card",
    provider,
    model: providerSpec.model || IMAGE_PROVIDERS[provider].defaultModel,
    size: providerSpec.size || sizeConfig.size,
    aspectRatio: providerSpec.aspectRatio || sizeConfig.aspectRatio,
    imageSize: providerSpec.imageSize || null,
    cropPolicy: providerSpec.cropPolicy || sizeConfig.cropPolicy || "fit",
    safeZone: providerSpec.safeZone || sizeConfig.safeZone || null,
    pptxLayout: sizeConfig.pptxLayout,
    description: sizeConfig.description,
  };
}

export function listImageUsages(providerInput) {
  return Object.keys(SIZE_MAP).map((usage) => getImageUsageConfig(usage, providerInput));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Generate a slide image using OpenAI GPT Image 2 or Google Nano Banana Pro.
 *
 * @param {Object} params
 * @param {string} params.prompt          - Image description, Chinese or English.
 * @param {string} [params.provider]      - "openai", "google", or aliases like "gpt-image" / "nano-banana-pro".
 * @param {string} [params.usage]         - One of SIZE_MAP keys. Defaults to "card".
 * @param {string} [params.model]         - Provider model override.
 * @param {string} [params.size]          - OpenAI size override, e.g. "1360x768"; adapted to gpt-image-2 constraints.
 * @param {string} [params.aspectRatio]   - Google aspect_ratio override, e.g. "16:9"; snapped to supported ratios.
 * @param {string} [params.imageSize]     - Google image_size override: "1K" | "2K" | "4K".
 * @param {string} [params.saveDir]       - Directory for generated images.
 * @param {number} [params.n]             - Number of images. Both providers max 4.
 * @param {string} [params.quality]       - OpenAI only: "high" | "medium" | "low".
 * @param {string} [params.outputFormat]  - Google only: "image/png" | "image/jpeg".
 * @param {number} [params.seed]          - Google only: generation seed.
 * @returns {Promise<Object|Object[]|null>} Image info, array for n > 1, or null if key missing.
 */
export async function generateSlideImage(params = {}) {
  const provider = resolveImageProvider(params.provider);
  const providerConfig = IMAGE_PROVIDERS[provider];
  const apiKey = params.apiKey || getApiKey(provider);

  if (!apiKey) {
    warnMissingApiKey(provider);
    return null;
  }

  const prompt = String(params.prompt || "").trim();
  if (!prompt) {
    throw new Error("[ai-image] prompt is required when an API key is configured");
  }

  const usage = params.usage || "card";
  const sizeConfig = SIZE_MAP[usage] || SIZE_MAP.card;
  if (!SIZE_MAP[usage]) {
    console.warn(
      `[ai-image] 未知 usage "${usage}"，可选: ${Object.keys(SIZE_MAP).join(", ")}，回退到 "card"`
    );
  }

  const n = clampImageCount(params.n || 1, providerConfig.maxN, provider);
  const saveDir = normalizeSaveDir(params.saveDir || providerConfig.defaultSaveDir);

  return generateProviderImage({ ...params, provider, prompt, n, usage, sizeConfig, saveDir, apiKey });
}

export function resolveImageProvider(provider) {
  const explicit = normalizeProvider(provider);
  if (explicit) return explicit;

  const envProvider = normalizeProvider(process.env.PPT_IMAGE_PROVIDER || process.env.AI_IMAGE_PROVIDER);
  if (envProvider) return envProvider;

  if (getApiKey("google") && !getApiKey("openai")) {
    return "google";
  }

  return "openai";
}

export function getImageBaseUrl(providerInput) {
  const provider = resolveImageProvider(providerInput);
  const config = IMAGE_PROVIDERS[provider];
  const override = process.env[config.baseUrlEnv];
  return (override || config.defaultBaseUrl).replace(/\/+$/, "");
}

export function listImageModels(provider) {
  const normalized = normalizeProvider(provider);

  const openai = [
    {
      provider: "openai",
      id: "gpt-image-2",
      constraints: GPT_IMAGE_SIZE_CONSTRAINTS,
      recommended: "默认推荐：SOTA 文生图，任意 16 倍数尺寸直传，适合封面、卡片、展示图",
    },
  ];

  const google = [
    {
      provider: "google",
      id: "gemini-3-pro-image",
      aspectRatios: GEMINI_IMAGE_ASPECT_RATIOS,
      imageSizes: GEMINI_IMAGE_SIZES,
      recommended: "Nano Banana Pro：原生支持 16:9 / 21:9 / 9:16 等全部 PPT 比例，1K/2K/4K",
    },
  ];

  if (normalized === "openai") return openai;
  if (normalized === "google") return google;
  const extra = ["bailian", "minimax"].map(provider => ({ provider, id: IMAGE_PROVIDERS[provider].defaultModel }));
  if (normalized === "custom") return [];
  if (normalized) return extra.filter(x => x.provider === normalized);
  return [...openai, ...google, ...extra];
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------
// Protocol selection is independent of model IDs; custom gateways use their exact IDs.
async function generateProviderImage(ctx) {
  const { provider } = ctx;
  const config = IMAGE_PROVIDERS[provider];
  const protocol = ctx.protocol || (provider === "custom" ? process.env.PPT_IMAGE_PROTOCOL : null)
    || ({ google: "gemini", bailian: "dashscope", minimax: "minimax" }[provider] || "openai");
  if (!["openai", "gemini", "dashscope", "minimax"].includes(protocol)) throw new Error("Unknown image protocol");
  const model = ctx.model || process.env[config.modelEnv] || config.defaultModel;
  const baseUrl = (ctx.baseUrl || getImageBaseUrl(provider)).replace(/\/+$/, "");
  const endpoint = ctx.endpoint || (provider === "custom" ? process.env.PPT_IMAGE_ENDPOINT : null);
  if (!model || (!baseUrl && !endpoint)) throw new Error("[ai-image] Configure model and baseUrl or full endpoint");
  const size = ctx.size || (provider === "openai" ? ctx.sizeConfig.providers.openai?.size : null) || ctx.sizeConfig.size;
  const aspectRatio = ctx.aspectRatio || ctx.sizeConfig.aspectRatio;
  const imageSize = ctx.imageSize || ctx.sizeConfig.providers.google?.imageSize || "1K";
  let path, body;
  if (protocol === "openai") {
    path = "/images/generations";
    body = { model, prompt: ctx.prompt, n: ctx.n, size: model === "gpt-image-2" ? adaptSizeForGptImage(size) : size };
    if (ctx.quality) body.quality = ctx.quality;
  } else if (protocol === "gemini") {
    path = `/models/${encodeURIComponent(model)}:generateContent`;
    body = { contents: [{ parts: [{ text: ctx.prompt }] }], generationConfig: {
      responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio, imageSize } } };
  } else if (protocol === "minimax") {
    path = "/image_generation";
    body = { model, prompt: ctx.prompt, n: ctx.n, aspect_ratio: aspectRatio, response_format: "base64" };
  } else {
    path = "/services/aigc/multimodal-generation/generation";
    body = { model, input: { messages: [{ role: "user", content: [{ text: ctx.prompt }] }] },
      parameters: { size: size.replace("x", "*"), n: ctx.n, watermark: false } };
  }
  if (ctx.seed !== undefined && protocol === "gemini") body.generationConfig.seed = ctx.seed;
  if (ctx.seed !== undefined && protocol === "minimax") body.seed = ctx.seed;
  // Provider-specific options are explicit; do not silently rewrite unfamiliar models.
  body = { ...body, ...(ctx.extraBody || {}) };
  const url = endpoint || `${baseUrl}${path}`;
  const parsed = new URL(url);
  if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("Invalid image endpoint");
  const timeoutMs = Number(ctx.timeoutMs ?? 120000);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("timeoutMs must be positive");
  const images = [];
  for (let i = 0; i < (protocol === "gemini" ? ctx.n : 1); i++) {
    const headers = { "Content-Type": "application/json", ...(protocol === "gemini"
      ? { "x-goog-api-key": ctx.apiKey } : { Authorization: `Bearer ${ctx.apiKey}` }) };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body),
      redirect: "error", signal: AbortSignal.timeout(timeoutMs) });
    // Avoid echoing upstream bodies, which can contain prompts, credentials or signed URLs.
    if (!res.ok) throw new Error(`[ai-image] ${provider} HTTP ${res.status}`);
    const data = await res.json();
    if (data.error || data.code || (data.base_resp?.status_code && data.base_resp.status_code !== 0)) {
      throw new Error(`[ai-image] ${provider} reported an API error`);
    }
    if (protocol === "openai") images.push(...(data.data || []).map(x => x.b64_json || x.url).filter(Boolean));
    if (protocol === "minimax") images.push(...(data.data?.image_base64 || data.data?.image_urls || []));
    if (protocol === "dashscope") {
      for (const choice of data.output?.choices || []) {
        images.push(...(choice.message?.content || []).map(x => x.image).filter(Boolean));
      }
      if (data.output?.task_id && !images.length) throw new Error("[ai-image] Async DashScope models require a polling adapter; select a synchronous model/region");
    }
    if (protocol === "gemini") {
      for (const candidate of data.candidates || []) for (const part of candidate.content?.parts || []) {
        const inline = part.inlineData || part.inline_data;
        if (inline?.data) images.push(`data:${inline.mimeType || inline.mime_type || "image/png"};base64,${inline.data}`);
      }
    }
  }
  if (!images.length) throw new Error(`[ai-image] ${provider} returned no images`);
  const encoded = [];
  for (const value of images) {
    if (/^https?:\/\//.test(value)) {
      // Image CDN requests never carry the API authorization header.
      const res = await fetch(value, { signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) throw new Error(`[ai-image] Image download HTTP ${res.status}`);
      const mime = res.headers.get("content-type")?.split(";")[0];
      if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) throw new Error("[ai-image] Download is not a supported image");
      encoded.push(`data:${mime};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`);
    } else encoded.push(value);
  }
  return saveBase64Images(encoded, ctx, { provider, model, size, aspectRatio, imageSize, defaultExt: ".png" });
}

async function saveBase64Images(images, ctx, meta) {
  await mkdir(ctx.saveDir.absolute, { recursive: true });

  const results = [];
  for (let i = 0; i < images.length; i++) {
    const decoded = decodeBase64Image(images[i], meta.defaultExt || ".png");
    const b = decoded.buffer;
    const ext = b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? ".png"
      : b[0] === 255 && b[1] === 216 && b[2] === 255 ? ".jpg"
      : b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" ? ".webp" : null;
    if (!ext) throw new Error("[ai-image] Response did not contain PNG, JPEG or WebP image bytes");
    const file = await writeImageBuffer(b, ctx.saveDir, ext);

    results.push(buildImageInfo(ctx, meta, file));
  }

  return ctx.n === 1 ? results[0] : results;
}

async function writeImageBuffer(buffer, saveDir, ext) {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = randomBytes(3).toString("hex");
  const filename = `${date}-${suffix}${ext}`;
  const absolutePath = join(saveDir.absolute, filename);

  await writeFile(absolutePath, buffer);

  const localPath = saveDir.isAbsolute
    ? absolutePath
    : `./${saveDir.relative.replace(/\/$/, "")}/${filename}`;

  return { absolutePath, localPath };
}

function buildImageInfo(ctx, meta, file) {
  return {
    provider: meta.provider,
    localPath: file.localPath,
    absolutePath: file.absolutePath,
    size: meta.size,
    aspectRatio: meta.aspectRatio,
    imageSize: meta.imageSize || null,
    pixelAspectRatio: sizeToAspectRatio(meta.size),
    cropPolicy: meta.cropPolicy || ctx.sizeConfig.cropPolicy || null,
    safeZone: ctx.sizeConfig.safeZone || null,
    model: meta.model,
    pptxLayout: ctx.sizeConfig.pptxLayout,
    usage: ctx.usage,
  };
}

// ---------------------------------------------------------------------------
// Helpers: config, validation, normalization
// ---------------------------------------------------------------------------
function normalizeProvider(provider) {
  if (!provider) return null;
  const normalized = String(provider).trim().toLowerCase();
  if (IMAGE_PROVIDERS[normalized]) return normalized;
  if (["dashscope", "aliyun"].includes(normalized)) return "bailian";
  if (normalized === "nano") return "google";
  if (normalized === "openai-compatible") return "custom";

  if (
    normalized === "openai" ||
    normalized === "gpt" ||
    normalized === "gpt-image" ||
    normalized === "gpt-image-2" ||
    normalized.startsWith("openai-") ||
    normalized.startsWith("gpt-image")
  ) {
    return "openai";
  }
  if (
    normalized === "google" ||
    normalized === "gemini" ||
    normalized === "nano-banana" ||
    normalized === "nano-banana-pro" ||
    normalized.startsWith("google-") ||
    normalized.startsWith("gemini-") ||
    normalized.startsWith("nano-banana")
  ) {
    return "google";
  }

  throw new Error(`[ai-image] Unknown provider "${provider}"; choose ${SUPPORTED_IMAGE_PROVIDERS.join(", ")}`);
}

function getApiKey(provider) {
  const config = IMAGE_PROVIDERS[provider];
  if (process.env[config.apiKeyEnv]) return process.env[config.apiKeyEnv];
  for (const fallback of config.apiKeyFallbackEnvs || []) {
    if (process.env[fallback]) return process.env[fallback];
  }
  return null;
}

function warnMissingApiKey(provider) {
  const config = IMAGE_PROVIDERS[provider];
  const lines = [
    `[ai-image] ${config.apiKeyEnv} 未设置，跳过 ${config.label} AI 生图。`,
    "  PPTX 会继续生成，请用纯色或占位图降级。",
    "  设置方式：",
    `    1. .env: PPT_IMAGE_PROVIDER=${provider}、${config.apiKeyEnv}=sk-xxx`,
    `    2. Shell: export PPT_IMAGE_PROVIDER=${provider}; export ${config.apiKeyEnv}=sk-xxx`,
  ];

  if (provider === "openai") {
    lines.push("  获取 API Key: https://platform.openai.com/api-keys");
  } else if (provider === "google") {
    lines.push("  获取 API Key: https://aistudio.google.com/apikey");
  }

  console.warn(lines.join("\n"));
}

function clampImageCount(value, max, provider) {
  let n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) n = 1;
  if (n > max) {
    console.warn(`[ai-image] ${IMAGE_PROVIDERS[provider].label} 单次最多生成 ${max} 张，已将 n=${n} 调整为 ${max}`);
    n = max;
  }
  return n;
}

function normalizeSaveDir(saveDir) {
  const absolute = resolve(process.cwd(), saveDir);
  const isAbs = isAbsolute(saveDir);
  const relative = saveDir
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/\/+$/, "");

  return {
    absolute,
    relative,
    isAbsolute: isAbs,
  };
}

function normalizeGeminiImageSize(value) {
  const normalized = String(value || "1K").trim().toUpperCase();
  if (GEMINI_IMAGE_SIZES.includes(normalized)) return normalized;
  console.warn(`[ai-image] Nano Banana Pro image_size 可选 ${GEMINI_IMAGE_SIZES.join(" / ")}，回退到 1K`);
  return "1K";
}

function decodeBase64Image(value, defaultExt) {
  const match = String(value).match(/^data:image\/([^;]+);base64,(.+)$/);
  if (match) {
    return {
      buffer: Buffer.from(match[2], "base64"),
      ext: extensionFromSubtype(match[1]) || defaultExt,
    };
  }

  return {
    buffer: Buffer.from(String(value), "base64"),
    ext: defaultExt,
  };
}

function extensionFromSubtype(subtype) {
  const normalized = subtype.toLowerCase();
  if (normalized === "jpeg" || normalized === "jpg") return ".jpg";
  if (normalized === "png") return ".png";
  if (normalized === "webp") return ".webp";
  return null;
}

function snapToMultiple(value, multiple) {
  return Math.max(multiple, Math.round(value / multiple) * multiple);
}

function parseAspectRatio(aspectRatio) {
  const match = String(aspectRatio || "").match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const denominator = Number.parseFloat(match[2]);
  if (denominator === 0) return null;
  return Number.parseFloat(match[1]) / denominator;
}

function sizeToAspectRatio(size) {
  const match = String(size || "").match(/^(\d+)x(\d+)$/);
  if (!match) return null;

  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function gcd(a, b) {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// ---------------------------------------------------------------------------
// Helper: add image to slide with proper sizing and padding
// ---------------------------------------------------------------------------
/**
 * Add a generated image to a PptxGenJS slide with recommended layout.
 *
 * @param {Object} slide       - PptxGenJS slide object.
 * @param {Object} imageInfo   - Return value from generateSlideImage().
 * @param {Object} [overrides] - Override positioning: { x, y, w, h, rounding, transparency }.
 */
export function addImageToSlide(slide, imageInfo, overrides = {}) {
  if (!imageInfo) return;

  const layout = imageInfo.pptxLayout || {};
  slide.addImage({
    path: imageInfo.absolutePath || imageInfo.localPath,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    w: overrides.w ?? layout.w ?? 2.5,
    h: overrides.h ?? layout.h ?? 2.5,
    rounding: overrides.rounding ?? false,
    transparency: overrides.transparency ?? 0,
  });
}

// ---------------------------------------------------------------------------
// Helper: add semi-transparent overlay on top of a background image
// ---------------------------------------------------------------------------
/**
 * Add a dark overlay rectangle on a slide for text readability over images.
 *
 * @param {Object} slide  - PptxGenJS slide object.
 * @param {Object} pres   - PptxGenJS presentation object.
 * @param {Object} [opts] - { x, y, w, h, color, opacity }.
 */
export function addImageOverlay(slide, pres, opts = {}) {
  const SW = 10;
  const SH = 5.625;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    w: opts.w ?? SW,
    h: opts.h ?? SH,
    fill: { color: opts.color ?? "0B1B2B", transparency: opts.opacity ?? 40 },
    line: { color: opts.color ?? "0B1B2B", transparency: opts.opacity ?? 40 },
  });
}
