import { createProxyHandler } from "@/lib/server/proxy-handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const handleProxy = createProxyHandler();
export const GET = handleProxy;
export const POST = handleProxy;

export function OPTIONS() {
  return Response.json({ error: "Cross-origin proxy access is disabled.", code: "method_not_allowed" }, {
    status: 405,
    headers: { "Cache-Control": "no-store" },
  });
}
