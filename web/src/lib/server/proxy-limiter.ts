import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { ProxyError } from "./proxy-policy";

const GLOBAL_LIMIT = 30;
const CLIENT_LIMIT = 6;
const WINDOW_MS = 60_000;
const MAX_LOCAL_CLIENTS = 1024;

// Checking and incrementing both buckets is atomic. The hash tag also keeps the
// keys in one Redis cluster slot. Rejected requests consume neither bucket.
export const RATE_LIMIT_SCRIPT = `
local global = tonumber(redis.call('GET', KEYS[1]) or '0')
local client = tonumber(redis.call('GET', KEYS[2]) or '0')
if global >= tonumber(ARGV[1]) or client >= tonumber(ARGV[2]) then
  return {0, math.max(1, redis.call('TTL', KEYS[1]), redis.call('TTL', KEYS[2]))}
end
local next_global = redis.call('INCR', KEYS[1])
local next_client = redis.call('INCR', KEYS[2])
if next_global == 1 then redis.call('EXPIRE', KEYS[1], ARGV[3]) end
if next_client == 1 then redis.call('EXPIRE', KEYS[2], ARGV[3]) end
return {1, 0}
`;

export interface LimitResult { allowed: boolean; retryAfter: number }
export interface LimiterDependencies { env: NodeJS.ProcessEnv; fetch: typeof fetch; now: () => number }

function unavailable(): ProxyError {
  return new ProxyError(503, "proxy_unavailable", "Model proxy is temporarily unavailable.");
}

function redisConfig(env: NodeJS.ProcessEnv): { url: string; token: string } | null {
  const value = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!value && !token) return null;
  if (!value || !token || token.length > 8192 || !/^[\x21-\x7e]+$/.test(token)) throw unavailable();
  let url: URL;
  try { url = new URL(value); } catch { throw unavailable(); }
  if (
    url.protocol !== "https:" ||
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.upstash\.io$/.test(url.hostname) ||
    url.port || url.username || url.password || url.pathname !== "/" || /[?#\\\s]/.test(value)
  ) throw unavailable();
  return { url: url.href, token };
}

function clientId(req: Request, env: NodeJS.ProcessEnv): string {
  // Vercel overwrites this header at its edge. No forwarded IP header is trusted
  // outside Vercel without an explicit trusted-proxy configuration.
  const forwarded = env.VERCEL === "1" ? req.headers.get("x-vercel-forwarded-for") : null;
  const address = forwarded?.trim();
  return createHash("sha256").update(address && isIP(address) ? address : "unknown").digest("hex");
}

export function createRateLimiter(deps: LimiterDependencies) {
  const clients = new Map<string, { count: number; resetAt: number }>();
  let global = { count: 0, resetAt: 0 };
  return async (req: Request, signal: AbortSignal): Promise<LimitResult> => {
    const config = redisConfig(deps.env);
    const client = clientId(req, deps.env);
    if (config) {
      try {
        const response = await deps.fetch(config.url, {
          method: "POST", redirect: "error",
          headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
          body: JSON.stringify([
            "EVAL", RATE_LIMIT_SCRIPT, 2,
            "slide-recipes:proxy:{limit}:global", `slide-recipes:proxy:{limit}:client:${client}`,
            GLOBAL_LIMIT, CLIENT_LIMIT, WINDOW_MS / 1000,
          ]),
          signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
        });
        if (!response.ok) throw unavailable();
        const data = await response.json() as { result?: unknown; error?: unknown };
        const result = data.result;
        if (
          data.error || !Array.isArray(result) || result.length !== 2 ||
          (result[0] !== 0 && result[0] !== 1) || !Number.isInteger(result[1]) ||
          result[1] < 0 || result[1] > 60
        ) throw unavailable();
        return { allowed: result[0] === 1, retryAfter: Math.max(1, result[1]) };
      } catch {
        // Never fall back to a per-instance limit if a shared limit fails.
        throw unavailable();
      }
    }
    if (deps.env.NODE_ENV === "production" || deps.env.VERCEL === "1") throw unavailable();
    const now = deps.now();
    for (const [key, entry] of clients) if (entry.resetAt <= now) clients.delete(key);
    if (global.resetAt <= now) global = { count: 0, resetAt: now + WINDOW_MS };
    const current = clients.get(client);
    if (global.count >= GLOBAL_LIMIT || (current && current.count >= CLIENT_LIMIT) || (!current && clients.size >= MAX_LOCAL_CLIENTS)) {
      return { allowed: false, retryAfter: Math.max(1, Math.ceil(((current?.resetAt || global.resetAt) - now) / 1000)) };
    }
    global.count++;
    clients.set(client, { count: (current?.count || 0) + 1, resetAt: current?.resetAt || now + WINDOW_MS });
    return { allowed: true, retryAfter: 1 };
  };
}
