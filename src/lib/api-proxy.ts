import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { rewriteUpstreamSetCookieForSameOrigin } from "@/lib/rewrite-upstream-set-cookie";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

/** Prefixes allowed through the same-origin BFF proxy (relative to /V1/). */
const ALLOWED_PATH_PREFIXES = [
  "auth/",
  "users/",
  "companies/",
  "admin/",
  "files/",
  "leads/",
  "notifications/",
  "onboarding/",
  "installateur/",
  "health/",
  "ops/",
] as const;

const ACCESS_TOKEN_COOKIE = "joya_access_token";
const REFRESH_TOKEN_COOKIE = "joya_refresh_token";
const IMPERSONATION_ACCESS_COOKIE = "joya_impersonation_token";
const AUTH_COOKIE_NAMES = new Set([
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  IMPERSONATION_ACCESS_COOKIE,
]);

function getApiProxyTarget(): string {
  const target = process.env.API_PROXY_TARGET?.trim();
  if (!target) {
    throw new Error("API_PROXY_TARGET is not configured");
  }
  return target.replace(/\/$/, "");
}

function isAllowedProxyPath(path: string): boolean {
  if (!path || path.includes("..") || path.startsWith("/")) return false;
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix),
  );
}

function requiresSession(path: string): boolean {
  if (path.startsWith("auth/")) {
    const publicAuth = [
      "auth/login",
      "auth/refresh",
      "auth/request-password-reset",
      "auth/reset-password",
      "auth/logout",
      "auth/impersonate/consume",
    ];
    return !publicAuth.some((p) => path === p || path.startsWith(`${p}/`));
  }
  if (
    path === "users/register" ||
    path.startsWith("users/verification") ||
    path.startsWith("users/verify") ||
    path.startsWith("users/resend-verification")
  ) {
    return false;
  }
  if (path.startsWith("health/")) return false;
  return true;
}

export async function proxyApiRequest(
  request: NextRequest,
  pathSegments: string[],
): Promise<Response> {
  const path = pathSegments.join("/");

  if (!isAllowedProxyPath(path)) {
    return NextResponse.json({ message: "Proxy path not allowed" }, { status: 403 });
  }

  if (requiresSession(path)) {
    const hasSession = Boolean(
      request.cookies.get(IMPERSONATION_ACCESS_COOKIE)?.value?.trim() ||
        request.cookies.get(ACCESS_TOKEN_COOKIE)?.value?.trim() ||
        request.headers.get("authorization")?.trim(),
    );
    if (!hasSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  const targetUrl = `${getApiProxyTarget()}/V1/${path}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  const impersonation = request.cookies
    .get(IMPERSONATION_ACCESS_COOKIE)
    ?.value?.trim();
  const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value?.trim();
  const refresh = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value?.trim();
  const cookieParts: string[] = [];
  if (impersonation) {
    cookieParts.push(`${ACCESS_TOKEN_COOKIE}=${impersonation}`);
  } else {
    if (access) cookieParts.push(`${ACCESS_TOKEN_COOKIE}=${access}`);
    if (refresh) cookieParts.push(`${REFRESH_TOKEN_COOKIE}=${refresh}`);
  }
  for (const cookie of request.cookies.getAll()) {
    if (AUTH_COOKIE_NAMES.has(cookie.name) || !cookie.value) continue;
    cookieParts.push(`${cookie.name}=${cookie.value}`);
  }
  if (cookieParts.length > 0) {
    headers.set("cookie", cookieParts.join("; "));
  } else {
    headers.delete("cookie");
  }

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  const upstream = await fetch(targetUrl, init);

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // Drop hop-by-hop, Set-Cookie (rewritten below), upstream CORS, and
    // encoding/length headers. `fetch()` decompresses the body, so echoing
    // content-encoding/content-length makes browsers fail the response
    // (axios sees status 0 / Network Error) — common on larger JSON like /users/me.
    if (
      HOP_BY_HOP_HEADERS.has(lower) ||
      lower === "set-cookie" ||
      lower.startsWith("access-control-") ||
      lower === "content-encoding" ||
      lower === "content-length" ||
      lower === "transfer-encoding"
    ) {
      return;
    }
    responseHeaders.set(key, value);
  });
  responseHeaders.set("cache-control", "private, no-store");

  // Multiple Set-Cookie headers must be appended — Headers.set keeps only the last.
  // Rewrite for first-party storage on the Next app host (Safari / iOS / private).
  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];
  const requestIsHttps =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ===
      "https";
  for (const raw of setCookies) {
    responseHeaders.append(
      "set-cookie",
      rewriteUpstreamSetCookieForSameOrigin(raw, { secure: requestIsHttps }),
    );
  }

  // Buffer after fetch() auto-decompression so we never advertise a stale
  // content-encoding/length to the browser.
  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
