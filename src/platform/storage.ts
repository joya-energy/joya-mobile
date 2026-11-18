import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Sync-ish storage mimicking web localStorage / sessionStorage APIs
 * used by copied customer-web helpers (signup-flow, verification-code, drafts).
 *
 * Values are cached in memory after hydrate(); callers that need sync getItem
 * after app boot should await hydrateStorage() once at startup.
 */

const memory = new Map<string, string>();
const sessionKeys = new Set<string>();
let hydrated = false;

export async function hydrateStorage(): Promise<void> {
  if (hydrated) return;
  const keys = await AsyncStorage.getAllKeys();
  const pairs = await AsyncStorage.multiGet(keys);
  for (const [key, value] of pairs) {
    if (typeof value === "string") memory.set(key, value);
  }
  hydrated = true;
}

function persist(key: string, value: string | null) {
  if (sessionKeys.has(key)) return;
  if (value === null) {
    void AsyncStorage.removeItem(key);
  } else {
    void AsyncStorage.setItem(key, value);
  }
}

export const appStorage = {
  getItem(key: string): string | null {
    return memory.has(key) ? (memory.get(key) as string) : null;
  },
  setItem(key: string, value: string): void {
    memory.set(key, value);
    persist(key, value);
  },
  removeItem(key: string): void {
    memory.delete(key);
    persist(key, null);
  },
  clear(): void {
    memory.clear();
    void AsyncStorage.clear();
  },
};

/** sessionStorage equivalent — cleared on cold start (never persisted). */
export const sessionStorage = {
  getItem(key: string): string | null {
    return memory.has(key) ? (memory.get(key) as string) : null;
  },
  setItem(key: string, value: string): void {
    sessionKeys.add(key);
    memory.set(key, value);
  },
  removeItem(key: string): void {
    sessionKeys.add(key);
    memory.delete(key);
  },
  clear(): void {
    for (const key of sessionKeys) memory.delete(key);
    sessionKeys.clear();
  },
};
