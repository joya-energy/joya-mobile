import { filesApi } from "@/lib/files/api";
import { onSocketEvent } from "@/lib/socket/client";

export type UploadConfirmationResult = {
  status: "uploaded" | "failed" | "expired";
  errorReason?: string | null;
  diagnostic?: string;
  finalizedBy?: "webhook" | "confirm" | "already";
};

type SocketPayload = Record<string, unknown> | null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForUploadSocketEvent(
  uploadSessionId: string,
  timeoutMs: number,
): Promise<UploadConfirmationResult> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      unsubscribe();
      reject(new Error("SOCKET_TIMEOUT"));
    }, timeoutMs);

    const handler = (payload: SocketPayload) => {
      if (!payload || typeof payload !== "object") return;

      const eventPayload = payload as Record<string, unknown>;
      const data =
        eventPayload.data && typeof eventPayload.data === "object"
          ? (eventPayload.data as Record<string, unknown>)
          : null;
      const sessionId =
        typeof data?.uploadSessionId === "string" ? data.uploadSessionId : null;
      if (sessionId !== uploadSessionId) return;

      window.clearTimeout(timer);
      unsubscribe();

      if (eventPayload.type === "success") {
        resolve({ status: "uploaded", finalizedBy: "webhook" });
        return;
      }

      const errorReason =
        typeof data?.errorReason === "string" ? data.errorReason : null;
      reject(
        new Error(
          errorReason ||
            "Le téléversement a échoué côté serveur (notification socket).",
        ),
      );
    };

    const unsubscribe = onSocketEvent("file.status.changed", handler);
  });
}

async function pollUploadConfirmation(
  fileId: string,
  uploadSessionId: string,
  timeoutMs: number,
  intervalMs: number,
): Promise<UploadConfirmationResult> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await filesApi.confirmUpload({ fileId, uploadSessionId });

    if (result.status === "uploaded") {
      return {
        status: "uploaded",
        finalizedBy: result.finalizedBy,
        diagnostic: result.diagnostic,
      };
    }

    if (result.status === "failed" || result.status === "expired") {
      throw new Error(
        result.errorReason ||
          result.diagnostic ||
          "Le téléversement a échoué côté serveur.",
      );
    }

    await sleep(intervalMs);
  }

  throw new Error("CONFIRM_TIMEOUT");
}

export async function waitForUploadConfirmation(params: {
  fileId: string;
  uploadSessionId: string;
  timeoutMs?: number;
}): Promise<UploadConfirmationResult> {
  const timeoutMs = params.timeoutMs ?? 90_000;

  const socketAttempt = waitForUploadSocketEvent(
    params.uploadSessionId,
    timeoutMs,
  ).catch((error: unknown) => {
    if (error instanceof Error && error.message === "SOCKET_TIMEOUT") {
      return null;
    }
    throw error;
  });

  const pollAttempt = (async () => {
    await sleep(1_500);
    return pollUploadConfirmation(
      params.fileId,
      params.uploadSessionId,
      timeoutMs,
      2_000,
    );
  })();

  const winner = await Promise.race([
    socketAttempt.then((result) =>
      result ? ({ kind: "socket" as const, result }) : null,
    ),
    pollAttempt.then((result) => ({ kind: "poll" as const, result })),
  ]);

  if (winner) {
    return winner.result;
  }

  const pollResult = await pollAttempt.catch((error: unknown) => {
    if (error instanceof Error && error.message === "CONFIRM_TIMEOUT") {
      throw new Error(
        "Le fichier a été envoyé au stockage mais la confirmation serveur n'est pas arrivée. " +
          "Contactez le support si le problème persiste.",
      );
    }
    throw error;
  });

  return pollResult;
}
