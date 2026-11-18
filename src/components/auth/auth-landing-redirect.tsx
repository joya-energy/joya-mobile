"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

type AuthLandingRedirectProps = {
  /** Where to send authenticated users (e.g. /client, /admin). */
  authenticatedPath: string;
  /** Optional redirect when the session is missing or invalid. */
  unauthenticatedPath?: string;
  /** Shown only when there is no valid session (landing page, etc.). */
  children?: React.ReactNode;
};

/**
 * Root-page gate: if the httpOnly session cookie is valid, redirect to the app.
 * Otherwise render children or redirect to `unauthenticatedPath`.
 */
export function AuthLandingRedirect({
  authenticatedPath,
  unauthenticatedPath,
  children,
}: AuthLandingRedirectProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace(authenticatedPath);
      return;
    }

    if (unauthenticatedPath) {
      router.replace(unauthenticatedPath);
    }
  }, [isAuthenticated, isLoading, router, authenticatedPath, unauthenticatedPath]);

  if (isAuthenticated || (unauthenticatedPath && isLoading)) {
    return null;
  }

  if (unauthenticatedPath) {
    return null;
  }

  // Public landing: show content while session is checked; redirect only if authenticated.
  return <>{children}</>;
}
