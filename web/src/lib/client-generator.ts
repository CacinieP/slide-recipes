import { buildPrompt, clampSlideCount, validatePlan } from "./prompt";
import { resolveTheme, resolveFontPair, resolveStyleMetrics } from "./palettes";
import { renderPptx } from "./render";
import type { DeckPlan, GenerateOptions, ModelConfig } from "./types";

const DEFAULT_BASE_URL = "https://api.modelbest.cn/v1";
const DEFAULT_MODEL = "MiniCPM-V-4.7-35B-A3B";

export interface GenerateDeckResult {
  blob: Blob;
  blobUrl: string;
  fileName: string;
  sizeKb: number;
  plan: DeckPlan;
}

/**
 * 智能网络请求：
 * 1. 优先通过同源 /api/proxy 进行服务端中转 (彻底杜绝浏览器跨域 CORS 拦截)
 * 2. 若当前环境无代理服务端，自动回退到浏览器直连
 */
export async function smartFetch(
  targetUrl: string,
  init: RequestInit = {},
): Promise<Response> {
  try {
    const headers = new Headers(init.headers || {});
    headers.set("x-target-url", targetUrl);

    const proxyResp = await fetch("/api/proxy", {
      ...init,
      headers,
    });

    if (proxyResp.status !== 404 && proxyResp.status !== 405) {
      return proxyResp;
    }
  } catch {
    // 代理网络异常，回退直连
  }

  return fetch(targetUrl, init);
}

/**
 * Call the user's OpenAI-compatible model service directly from the browser.
 */
export async function requestLlmPlan(
  opts: GenerateOptions,
  config: ModelConfig,
): Promise<DeckPlan> {
  const baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = config.model || DEFAULT_MODEL;
  const apiKey = (config.apiKey || "").trim();

  if (!apiKey) {
    throw new Error("请在左侧填写 API Key 后重试。");
  }

  const count = clampSlideCount(opts.slideCount);
  const { system, user } = buildPrompt(opts);

  // Request body with response_format json_object; fallback without if rejected
  const reqBody: any = {
    model,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  let resp: Response;
  try {
    resp = await smartFetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    // If 400 with response_format unsupported message, retry once without it
    if (resp.status === 400) {
      const errClone = resp.clone();
      const errText = await errClone.text().catch(() => "");
      if (errText.includes("response_format") || errText.includes("json_object")) {
        delete reqBody.response_format;
        resp = await smartFetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reqBody),
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Network request failed")) {
      throw new Error(
        `网络请求失败: Failed to fetch (浏览器跨域受阻 CORS)。服务商 API (${baseUrl}) 未向浏览器返回 Access-Control-Allow-Origin 跨域头。请开启浏览器「Allow CORS」插件直连，或切换为左侧免 API 的自定义大纲模式。`,
      );
    }
    throw new Error(`网络请求失败: ${msg}`);
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

  let planJson: unknown;
  try {
    planJson = JSON.parse(content);
  } catch (e) {
    // If wrapped in ```json ... ```, strip markdown fences
    const clean = content.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    planJson = JSON.parse(clean);
  }

  const { plan, error } = validatePlan(planJson, count);
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
    fontPair: GenerateOptions["fontPair"];
    styleRecipe: GenerateOptions["styleRecipe"];
    language: "zh-CN" | "en-US";
  },
): Promise<GenerateDeckResult> {
  const theme = resolveTheme(opts.paletteId);
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
