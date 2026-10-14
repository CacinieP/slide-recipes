import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import https from "node:https";
import type { ClientRequest, IncomingMessage } from "node:http";
import type { LookupFunction } from "node:net";
import type { RequestOptions } from "node:https";
import { createRateLimiter } from "./proxy-limiter";
import {
  configuredBaseUrls, isPublicAddress, MAX_REQUEST_BYTES, MAX_RESPONSE_BYTES, ProxyError,
  REQUEST_TIMEOUT_MS, validateAuthorization, validateBrowserOrigin,
  validateTarget, withAbort,
} from "./proxy-policy";

export type HttpsRequester = (options: RequestOptions, callback: (res: IncomingMessage) => void) => ClientRequest;
export interface ProxyDependencies {
  env?: NodeJS.ProcessEnv;
  fetch?: typeof fetch;
  now?: () => number;
  resolveHostname?: (hostname: string) => Promise<LookupAddress[]>;
  request?: HttpsRequester;
  timeoutMs?: number;
}

function jsonResponse(status: number, code: string, error: string, retryAfter?: number): Response {
  return Response.json({ error, code }, {
    status,
    headers: {
      "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
      ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
    },
  });
}

function unsupportedResponseFormat(body: Buffer): boolean {
  // Keep the one intentional compatibility retry without returning provider text.
  const data = JSON.parse(body.toString("utf8")) as { error?: { code?: unknown; param?: unknown; message?: unknown } };
  const error = data?.error;
  if (!error || typeof error !== "object") return false;
  if (error.code === "unsupported_response_format") return true;
  if (error.code === "unsupported_parameter" && error.param === "response_format") return true;
  if (typeof error.message !== "string" || error.message.length > 1000) return false;
  return /\bresponse_format\b.{0,160}\b(?:not supported|unsupported)\b/i.test(error.message) ||
    /\bdoes not support\b.{0,160}\bresponse_format\b/i.test(error.message) ||
    /\bunsupported (?:parameter|option|field)\b.{0,80}\bresponse_format\b/i.test(error.message);
}

async function readJsonBody(req: Request, signal: AbortSignal): Promise<Buffer> {
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new ProxyError(415, "json_required", "Request body must be JSON.");
  }
  const declared = req.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_REQUEST_BYTES)) {
    throw new ProxyError(413, "request_too_large", "Model request is too large.");
  }
  if (!req.body) throw new ProxyError(400, "invalid_json", "A JSON object is required.");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await withAbort(reader.read(), signal);
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_REQUEST_BYTES) throw new ProxyError(413, "request_too_large", "Model request is too large.");
      chunks.push(chunk.value);
    }
  } finally {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const body = Buffer.concat(chunks);
  let parsed: unknown;
  try { parsed = JSON.parse(body.toString("utf8")); }
  catch { throw new ProxyError(400, "invalid_json", "A JSON object is required."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ProxyError(400, "invalid_json", "A JSON object is required.");
  }
  const stream = (parsed as { stream?: unknown }).stream;
  if (stream !== undefined && stream !== false) {
    throw new ProxyError(400, "stream_not_supported", "Streaming is not supported by this proxy.");
  }
  return body;
}

function requestUpstream(
  target: URL, method: string, authorization: string, body: Buffer | undefined,
  pinned: LookupAddress, signal: AbortSignal, request: HttpsRequester,
): Promise<{ status: number; body: Buffer }> {
  return new Promise((resolve, reject) => {
    let client: ClientRequest | undefined;
    let upstream: IncomingMessage | undefined;
    let settled = false;
    const finish = (error?: Error, value?: { status: number; body: Buffer }) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      if (error) {
        reject(error);
        upstream?.destroy();
        client?.destroy();
      } else if (value) resolve(value);
    };
    const onAbort = () => finish(new ProxyError(504, "proxy_timeout", "Model request timed out."));
    const pinnedLookup: LookupFunction = (hostname, options, callback) => {
      if (hostname !== target.hostname) callback(new Error("Unexpected DNS lookup"), "", 0);
      else if (options.all) callback(null, [pinned]);
      else callback(null, pinned.address, pinned.family);
    };
    if (signal.aborted) { onAbort(); return; }
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      client = request({
        protocol: "https:", hostname: target.hostname, port: 443,
        path: target.pathname, method, lookup: pinnedLookup, family: pinned.family,
        // A new connection must use this request's validated DNS lookup.
        agent: false, servername: target.hostname, rejectUnauthorized: true,
        headers: {
          Authorization: authorization, Accept: "application/json", "Accept-Encoding": "identity",
          ...(body ? { "Content-Type": "application/json", "Content-Length": body.byteLength } : {}),
        },
      }, (res) => {
        upstream = res;
        if (settled) { res.destroy(); return; }
        const status = res.statusCode || 502;
        const contentType = res.headers["content-type"]?.split(";")[0].trim().toLowerCase();
        const contentEncoding = res.headers["content-encoding"];
        if (status >= 300 && status < 400) {
          finish(new ProxyError(502, "upstream_redirect", "Model endpoint redirects are not allowed."));
          return;
        }
        if (
          status < 200 || status > 599 ||
          (status !== 204 && (!contentType || !/^application\/(?:json|[a-z0-9.+-]+\+json)$/.test(contentType))) ||
          (contentEncoding && contentEncoding !== "identity")
        ) {
          finish(new ProxyError(502, "invalid_upstream_response", "Invalid model response."));
          return;
        }
        const declared = res.headers["content-length"];
        if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_RESPONSE_BYTES)) {
          finish(new ProxyError(502, "response_too_large", "Model response is too large."));
          return;
        }
        const chunks: Buffer[] = [];
        let bytes = 0;
        res.on("data", (chunk: Buffer | string) => {
          if (settled) return;
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          bytes += buffer.byteLength;
          if (bytes > MAX_RESPONSE_BYTES) finish(new ProxyError(502, "response_too_large", "Model response is too large."));
          else chunks.push(buffer);
        });
        res.on("error", () => finish(new ProxyError(502, "upstream_failed", "Model request failed.")));
        res.on("aborted", () => finish(new ProxyError(502, "upstream_failed", "Model request failed.")));
        res.on("end", () => {
          const responseBody = Buffer.concat(chunks);
          if (status !== 204) {
            try { JSON.parse(responseBody.toString("utf8")); }
            catch { finish(new ProxyError(502, "invalid_upstream_response", "Invalid model response.")); return; }
          }
          finish(undefined, { status, body: responseBody });
        });
      });
      client.on("error", () => finish(new ProxyError(502, "upstream_failed", "Model request failed.")));
      client.end(body);
    } catch { finish(new ProxyError(502, "upstream_failed", "Model request failed.")); }
  });
}

export function createProxyHandler(deps: ProxyDependencies = {}) {
  const env = deps.env || process.env;
  const limiter = createRateLimiter({ env, fetch: deps.fetch || fetch, now: deps.now || Date.now });
  const resolveHostname = deps.resolveHostname || ((hostname) => lookup(hostname, { all: true, verbatim: true }));
  const request: HttpsRequester = deps.request || ((options, callback) => https.request(options, callback));
  return async (req: Request): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? REQUEST_TIMEOUT_MS);
    const abort = () => controller.abort();
    req.signal.addEventListener("abort", abort, { once: true });
    if (req.signal.aborted) controller.abort();
    try {
      if (req.method !== "GET" && req.method !== "POST") {
        throw new ProxyError(405, "method_not_allowed", "Only GET and POST are supported.");
      }
      validateBrowserOrigin(req);
      // Reject the legacy ?url form; targets come from one explicit header.
      if (new URL(req.url).search) throw new ProxyError(400, "invalid_target", "Query parameters are not supported.");
      const target = validateTarget(req.headers.get("x-target-url"), req.method, configuredBaseUrls(env));
      const authorization = validateAuthorization(req.headers.get("authorization"));
      const limit = await withAbort(limiter(req, controller.signal), controller.signal);
      if (!limit.allowed) return jsonResponse(429, "rate_limited", "Too many model requests. Please retry later.", limit.retryAfter);
      const body = req.method === "POST" ? await readJsonBody(req, controller.signal) : undefined;
      const addresses = await withAbort(resolveHostname(target.hostname), controller.signal);
      if (!addresses.length || addresses.some(({ address, family }) => !isPublicAddress(address) || (address.includes(":") ? 6 : 4) !== family)) {
        throw new ProxyError(502, "unsafe_upstream_address", "Model endpoint is unavailable.");
      }
      const result = await requestUpstream(target, req.method, authorization, body, addresses[0], controller.signal, request);
      if (result.status >= 400) {
        if (
          req.method === "POST" && body && (result.status === 400 || result.status === 422) &&
          Object.prototype.hasOwnProperty.call(JSON.parse(body.toString("utf8")), "response_format") &&
          unsupportedResponseFormat(result.body)
        ) {
          return jsonResponse(result.status, "unsupported_response_format", "The model service does not support response_format.");
        }
        // Errors may contain credentials, account details, or internal URLs.
        return jsonResponse(result.status, "upstream_error", "The model service rejected this request.");
      }
      return new Response(result.status === 204 ? null : new Uint8Array(result.body), {
        status: result.status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
      });
    } catch (error) {
      if (error instanceof ProxyError) return jsonResponse(error.status, error.code, error.message);
      return jsonResponse(502, "upstream_failed", "Model request failed.");
    } finally {
      clearTimeout(timer);
      req.signal.removeEventListener("abort", abort);
      controller.abort();
    }
  };
}
