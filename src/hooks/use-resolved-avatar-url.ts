"use client";

import { useEffect, useState } from "react";
import { resolveAvatarDisplayUrl } from "@/lib/profile/avatar-display";

export function useResolvedAvatarUrl(avatar?: string | null) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    void resolveAvatarDisplayUrl(avatar).then((url) => {
      if (!cancelled) {
        setSrc(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [avatar]);

  return { src, failed, setFailed };
}
