import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-target-url",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  const targetUrl =
    req.headers.get("x-target-url") || req.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing x-target-url header or ?url parameter" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const authHeader = req.headers.get("authorization");

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json",
      },
    });

    const data = await upstreamRes.text();
    const contentType =
      upstreamRes.headers.get("content-type") || "application/json";

    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": contentType,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: `Proxy request failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}

export async function POST(req: NextRequest) {
  const targetUrl =
    req.headers.get("x-target-url") || req.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing x-target-url header or ?url parameter" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const authHeader = req.headers.get("authorization");
  const bodyText = await req.text();

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type":
          req.headers.get("content-type") || "application/json",
      },
      body: bodyText,
    });

    const data = await upstreamRes.text();
    const contentType =
      upstreamRes.headers.get("content-type") || "application/json";

    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": contentType,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: `Proxy request failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}
