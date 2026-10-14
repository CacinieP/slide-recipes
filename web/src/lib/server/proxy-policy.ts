import { isIP } from "node:net";
import ipaddr from "ipaddr.js";

// Deliberately independent of the editable client-side provider presets.
export const PROXY_BASE_URLS = [
  "https://api.modelbest.cn/v1",
  "https://api.stepfun.com/v1",
  "https://api.moonshot.cn/v1",
  "https://open.bigmodel.cn/api/paas/v4",
  "https://api.minimax.chat/v1",
  "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "https://api.openai.com/v1",
] as const;

export const MAX_REQUEST_BYTES = 256 * 1024;
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
export const REQUEST_TIMEOUT_MS = 120_000;

export class ProxyError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

export function configuredBaseUrls(env: NodeJS.ProcessEnv): string[] {
  const extra = (env.MODEL_PROXY_ALLOWED_BASE_URLS || "").split(",").map(v => v.trim()).filter(Boolean);
  return [...PROXY_BASE_URLS, ...extra.map(value => {
    let url: URL;
    try { url = new URL(value); } catch { throw new ProxyError(503, "invalid_proxy_config", "Invalid proxy allowlist configuration."); }
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash ||
      /[\\?#\s]/.test(value) || isIP(url.hostname.replace(/^\[|\]$/g, "")) ||
      !url.hostname.includes(".") || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(url.hostname)) {
      throw new ProxyError(503, "invalid_proxy_config", "Invalid proxy allowlist configuration.");
    }
    return url.href.replace(/\/+$/, "");
  })];
}
export function validateTarget(value: string | null, method: string, bases: readonly string[] = PROXY_BASE_URLS): URL {
  if (!value || value.length > 2048 || /[\\?#\s]/.test(value)) {
    throw new ProxyError(400, "invalid_target", "Invalid model endpoint.");
  }
  let target: URL;
  try { target = new URL(value); }
  catch { throw new ProxyError(400, "invalid_target", "Invalid model endpoint."); }
  if (
    target.protocol !== "https:" || target.username || target.password ||
    target.port || target.search || target.hash ||
    isIP(target.hostname.replace(/^\[|\]$/g, ""))
  ) throw new ProxyError(403, "target_not_allowed", "Model endpoint is not approved for the proxy.");
  const suffix = method === "GET" ? "/models" : method === "POST" ? "/chat/completions" : null;
  if (!suffix || !bases.some((base) => `${base}${suffix}` === target.href)) {
    throw new ProxyError(403, "target_not_allowed", "Model endpoint is not approved for the proxy.");
  }
  return target;
}

export function isPublicAddress(address: string): boolean {
  if (!isIP(address)) return false;
  const parsed = ipaddr.parse(address);
  if (parsed.range() !== "unicast") return false;
  // Fail closed on IPv6 outside the currently assigned global unicast block.
  return parsed.kind() === "ipv4" || (parsed.toByteArray()[0] & 0xe0) === 0x20;
}

export function validateBrowserOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  if ((origin && origin !== new URL(req.url).origin) || (site && site !== "same-origin")) {
    throw new ProxyError(403, "cross_site_request", "Cross-site proxy requests are not allowed.");
  }
  // Browser metadata is not authentication: non-browser clients can forge or
  // omit it. Shared rate limits are therefore required in production.
}

export function validateAuthorization(value: string | null): string {
  if (!value || value.length > 8192 || !/^Bearer [\x21-\x7e]+$/i.test(value)) {
    throw new ProxyError(401, "missing_api_key", "A Bearer API key is required.");
  }
  return value;
}

export function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new ProxyError(504, "proxy_timeout", "Model request timed out."));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
    if (signal.aborted) onAbort();
  });
}
