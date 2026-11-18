"use client";

import { useEffect, useState } from "react";

/** Live countdown until `nextEnodeRefreshAt` (ISO). */
export function useEnodeCooldown(
  nextEnodeRefreshAt: string | null,
  canRefresh: boolean,
): number {
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    const tick = () => {
      if (canRefresh || !nextEnodeRefreshAt) {
        setRemainingSec(0);
        return;
      }
      const diff = Math.ceil(
        (new Date(nextEnodeRefreshAt).getTime() - Date.now()) / 1000,
      );
      setRemainingSec(Math.max(0, diff));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [canRefresh, nextEnodeRefreshAt]);

  return remainingSec;
}

export function formatEnodeCooldownShort(seconds: number): string {
  if (seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
