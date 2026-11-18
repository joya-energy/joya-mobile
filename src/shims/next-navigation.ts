import { useRouter as useExpoRouter, usePathname, useLocalSearchParams, router } from "expo-router";

/** Shim for `next/navigation` used by copied customer-web files. */
export function useRouter() {
  const r = useExpoRouter();
  return {
    push: (href: string) => r.push(href as never),
    replace: (href: string) => r.replace(href as never),
    back: () => r.back(),
    prefetch: (_href: string) => {},
    refresh: () => {},
  };
}

export { usePathname, router };
export function useSearchParams() {
  const params = useLocalSearchParams();
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") map.set(key, value);
    else if (Array.isArray(value) && value[0]) map.set(key, value[0]);
  }
  return {
    get(key: string) {
      return map.get(key) ?? null;
    },
    toString() {
      const q = new URLSearchParams();
      for (const [k, v] of map) q.set(k, v);
      return q.toString();
    },
  };
}
