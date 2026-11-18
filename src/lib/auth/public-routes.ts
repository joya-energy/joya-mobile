/** Paths where a missing session must not force a redirect to login. */
export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/installateurs")) return true;
  if (pathname === "/approval" || pathname.startsWith("/approval/")) return true;
  if (
    pathname === "/devis-estimatif" ||
    pathname.startsWith("/devis-estimatif/")
  ) {
    return true;
  }
  return false;
}

export function shouldRedirectToLogin(pathname: string): boolean {
  return !isPublicPath(pathname);
}
