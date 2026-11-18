type Handler = (detail?: unknown) => void;

const listeners = new Map<string, Set<Handler>>();

/** Tiny EventTarget replacement for copied web `window.dispatchEvent` usage. */
export const appEvents = {
  on(type: string, handler: Handler): () => void {
    let set = listeners.get(type);
    if (!set) {
      set = new Set();
      listeners.set(type, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  },
  emit(type: string, detail?: unknown): void {
    const set = listeners.get(type);
    if (!set) return;
    for (const handler of set) handler(detail);
  },
};

export const AUTH_REDIRECT_LOGIN = "auth:redirect-login";
