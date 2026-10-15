import { buildPrompt, clampSlideCount, normalizeModelPlan, parseModelResponse, healModelPlan } from "./prompt";
import { resolveTheme, resolveFontPair, resolveStyleMetrics } from "./palettes";
import { renderPptx } from "./render";
import type { DeckPlan, GenerateOptions, ModelConfig, Theme } from "./types";

const DEFAULT_BASE_URL = "https://api.modelbest.cn/v1";
const DEFAULT_MODEL = "MiniCPM-V-4.7-1B";

export interface GenerateDeckResult {
  blob: Blob;
  blobUrl: string;
  fileName: string;
  sizeKb: number;
  plan: DeckPlan;
}

export type RequestMode = "proxy" | "direct";
export interface RequestConfig { mode?: RequestMode; proxyUrl?: string }
export const DEFAULT_REQUEST_MODE: RequestMode = process.env.NEXT_PUBLIC_MODEL_REQUEST_MODE === "direct" ? "direct" : "proxy";
export const DEFAULT_PROXY_URL = process.env.NEXT_PUBLIC_MODEL_PROXY_URL || "/api/proxy";

/** One explicitly selected transport; network failures never switch transport. */
export async function smartFetch(
  targetUrl: string,
  init: RequestInit = {},
  config: RequestConfig = {},
): Promise<Response> {
  const mode = config.mode || DEFAULT_REQUEST_MODE;
  const headers = new Headers(init.headers || {});
  headers.delete("x-target-url");
  if (mode === "proxy") headers.set("x-target-url", targetUrl);
  try {
    return await fetch(mode === "proxy" ? config.proxyUrl || DEFAULT_PROXY_URL : targetUrl, {
      ...init, headers, redirect: "error", credentials: "omit",
    });
  } catch {
    throw new Error(mode === "proxy"
      ? "无法连接本站模型代理，请检查网络、代理部署或稍后重试。"
      : "浏览器直连失败：可能是网络、端点或供应商 CORS 策略限制。请检查服务状态或使用已配置的代理。");
  }
}

/**
 * Call the user's approved OpenAI-compatible service through the site proxy.
 */
export async function requestLlmPlan(
  opts: GenerateOptions,
  config: ModelConfig,
): Promise<DeckPlan> {
  const baseUrl = (config.baseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  const model = config.model || DEFAULT_MODEL;
  const apiKey = (config.apiKey || "").trim();

  if (!apiKey) {
    throw new Error("请在左侧填写 API Key 后重试。");
  }

  const count = clampSlideCount(opts.slideCount);
  const { system, user } = buildPrompt(opts, model);

  // Retry only when the site's proxy classifies a response_format rejection.
  const reqBody: {
    model: string;
    temperature: number;
    stream: false;
    max_tokens: number;
    response_format?: { type: "json_object" };
    messages: Array<{ role: "system" | "user"; content: string }>;
  } = {
    model,
    temperature: 0.4,
    stream: false,
    max_tokens: 6000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  let resp = await smartFetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqBody),
  }, config);

  if (resp.status === 400 || resp.status === 422) {
    const proxyError: unknown = await resp.clone().json().catch(() => null);
    if (
      proxyError && typeof proxyError === "object" &&
      "code" in proxyError && proxyError.code === "unsupported_response_format"
    ) {
      delete reqBody.response_format;
      resp = await smartFetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      }, config);
    }
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`模型调用失败 (${resp.status}): ${text.slice(0, 300)}`);
  }

  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("模型返回为空，请重试。");
  }

  const planJson = parseModelResponse(content, model);
  let { plan, error } = normalizeModelPlan(planJson, count, model);

  // 通用模型大纲自愈：若因模型输出页数与要求微偏（如要求 20 页实际返回 24 页）或非致命格式偏差未通过严格校验，自动启动容错修复
  if (!plan && model !== "MiniCPM-V-4.7-1B") {
    const healed = healModelPlan(planJson, count);
    if (healed && healed.slides.length >= 2) {
      plan = healed;
      error = undefined;
    }
  }

  if (!plan) {
    throw new Error(error || "生成的大纲格式无效。");
  }

  return plan;
}

/**
 * Render a deck plan into a PPTX Blob in the browser or Node.js.
 */
export async function renderDeckPlanToBlob(
  plan: DeckPlan,
  opts: {
    paletteId: string;
    customTheme?: Theme;
    fontPair: GenerateOptions["fontPair"];
    styleRecipe: GenerateOptions["styleRecipe"];
    language: "zh-CN" | "en-US";
  },
): Promise<GenerateDeckResult> {
  const theme = opts.customTheme || resolveTheme(opts.paletteId);
  const fonts = resolveFontPair(opts.fontPair);
  const style = resolveStyleMetrics(opts.styleRecipe);

  const output = await renderPptx(plan, {
    theme,
    fonts,
    style,
    language: opts.language,
  });

  const blob: Blob =
    output instanceof Blob
      ? output
      : new Blob([new Uint8Array(output)], {
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        });

  const blobUrl = URL.createObjectURL(blob);
  const rawName = (plan.title || "presentation")
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "_")
    .slice(0, 40) || "presentation";
  const fileName = `${rawName}.pptx`;

  return {
    blob,
    blobUrl,
    fileName,
    sizeKb: Math.round(blob.size / 1024),
    plan,
  };
}
