export type ScopeFetchCallbacks = {
  beginScopeLoad: () => void;
  endScopeLoad: () => void;
} | null;

export async function runScopedFetch<T>(
  scope: ScopeFetchCallbacks,
  fetcher: () => Promise<T>,
): Promise<T> {
  scope?.beginScopeLoad();
  try {
    return await fetcher();
  } finally {
    scope?.endScopeLoad();
  }
}
