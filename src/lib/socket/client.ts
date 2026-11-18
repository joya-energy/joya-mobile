import { io, Socket } from "socket.io-client";
import { resolveSocketUrl } from "@/lib/api-base-url";

const SOCKET_URL = resolveSocketUrl();

type JsonPayload = Record<string, unknown> | null;
type SocketEventPayload = Record<string, unknown> | null | undefined;
type SocketAuthResponse = {
  success: boolean;
  message?: string;
  userId?: string;
};

type SocketEventListener = (payload: JsonPayload) => void;

let socket: Socket | null = null;
let anySocketBridgeAttached = false;

const anySocketListeners = new Set<
  (eventName: string, payload: SocketEventPayload) => void
>();

const pendingEventListeners = new Map<string, Set<SocketEventListener>>();

function parseSocketPayload(firstArg: unknown): SocketEventPayload {
  if (firstArg && typeof firstArg === "object") {
    return firstArg as Record<string, unknown>;
  }
  return undefined;
}

function attachPendingEventListeners(activeSocket: Socket): void {
  for (const [event, listeners] of pendingEventListeners) {
    for (const listener of listeners) {
      activeSocket.on(event, listener);
    }
  }
}

function attachAnySocketBridge(activeSocket: Socket): void {
  if (anySocketBridgeAttached) return;

  activeSocket.onAny((event, ...args) => {
    const payload = parseSocketPayload(args[0]);
    for (const listener of anySocketListeners) {
      listener(event, payload);
    }
  });

  anySocketBridgeAttached = true;
}

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token };
    socket.connect();
    attachAnySocketBridge(socket);
    attachPendingEventListeners(socket);
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,
    auth: { token },
  });

  attachAnySocketBridge(socket);
  attachPendingEventListeners(socket);
  return socket;
};

export const disconnectSocket = (): void => {
  if (!socket) return;
  socket.disconnect();
};

export const updateSocketAuth = (token: string): void => {
  if (!socket) return;
  socket.auth = { token };
  socket.emit("auth:login", { token }, (response: SocketAuthResponse) => {
    if (!response?.success) {
      console.warn(
        "[socket] auth:login failed:",
        response?.message || "unknown error",
      );
    }
  });
};

export const onSocketEvent = (
  event: string,
  listener: SocketEventListener,
): (() => void) => {
  if (!pendingEventListeners.has(event)) {
    pendingEventListeners.set(event, new Set());
  }
  pendingEventListeners.get(event)!.add(listener);
  socket?.on(event, listener);
  return () => {
    pendingEventListeners.get(event)?.delete(listener);
    socket?.off(event, listener);
  };
};

export const onAnySocketEvent = (
  listener: (eventName: string, payload: SocketEventPayload) => void,
): (() => void) => {
  anySocketListeners.add(listener);
  return () => {
    anySocketListeners.delete(listener);
  };
};

export const getSocket = (): Socket | null => socket;
