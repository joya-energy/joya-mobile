/**
 * Normalize upstream Set-Cookie for the same-origin Next BFF (/V1 proxy).
 * Strip Domain/Partitioned and force SameSite=Lax so Safari, iOS, and private
 * browsing store the session as a first-party cookie on the app host.
 */
export function rewriteUpstreamSetCookieForSameOrigin(
  raw: string,
  options?: { secure?: boolean },
): string {
  let cookie = String(raw || "").trim();
  if (!cookie) return cookie;

  cookie = cookie.replace(/;\s*Domain=[^;]*/gi, "");
  cookie = cookie.replace(/;\s*Partitioned(?:=[^;]*)?/gi, "");

  if (/;\s*SameSite=/i.test(cookie)) {
    cookie = cookie.replace(/;\s*SameSite=[^;]*/gi, "; SameSite=Lax");
  } else {
    cookie = `${cookie}; SameSite=Lax`;
  }

  const wantSecure = options?.secure !== false;
  if (wantSecure) {
    if (!/;\s*Secure(?:;|$)/i.test(cookie)) {
      cookie = `${cookie}; Secure`;
    }
  } else {
    cookie = cookie.replace(/;\s*Secure/gi, "");
  }

  return cookie;
}
