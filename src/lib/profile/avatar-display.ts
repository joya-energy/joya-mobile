import { filesApi } from "@/lib/files/api";

export function isBrowserReachableAvatarUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** Resolves stored object keys to a fresh signed view URL for <img src>. */
export async function resolveAvatarDisplayUrl(
  avatar: string | null | undefined,
): Promise<string | null> {
  if (!avatar?.trim()) return null;

  const trimmed = avatar.trim();
  if (isBrowserReachableAvatarUrl(trimmed)) {
    return trimmed;
  }

  try {
    const { viewUrl } = await filesApi.getViewUrl(trimmed);
    return viewUrl;
  } catch {
    return null;
  }
}
