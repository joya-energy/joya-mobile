import { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast";

/**
 * Fetch-on-mount for the info cards (loading → data | fallback + toast).
 * `reload()` refetches in place without flipping back to the loading state.
 * `fetcher` and `fallback` must be stable (module level) references.
 */
export function useCardData<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  errorMessage: string,
) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await fetcher();
        if (!cancelled) setData(next);
      } catch {
        if (!cancelled) {
          setData(fallback);
          toast.error(errorMessage);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetcher, fallback, errorMessage, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, loading, reload };
}
