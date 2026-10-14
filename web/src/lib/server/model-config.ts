import "server-only";

export const WEBSITE_MODEL_BASE_URL = "https://api.modelbest.cn/v1";
export const WEBSITE_MODEL_NAME = "MiniCPM-V-4.7-1B";
export const WEBSITE_MODEL_MAX_TOKENS = 6000;

export interface WebsiteModelConfig {
  readonly baseUrl: string;
  readonly chatCompletionsUrl: string;
  readonly model: string;
  readonly apiKey: string;
  readonly stream: false;
  readonly maxTokens: number;
}

/**
 * Scaffold for a future authenticated, quota-controlled generation endpoint.
 * The public BYOK proxy must not use the site's model credential.
 */
export function getWebsiteModelConfig(): WebsiteModelConfig {
  const apiKey = process.env.MODELBEST_API_KEY?.trim();
  if (!apiKey || apiKey.length > 8192 || !/^[\x21-\x7e]+$/.test(apiKey)) {
    throw new Error("The site model is unavailable.");
  }
  return Object.freeze({
    baseUrl: WEBSITE_MODEL_BASE_URL,
    chatCompletionsUrl: `${WEBSITE_MODEL_BASE_URL}/chat/completions`,
    model: WEBSITE_MODEL_NAME,
    apiKey,
    stream: false,
    maxTokens: WEBSITE_MODEL_MAX_TOKENS,
  });
}
