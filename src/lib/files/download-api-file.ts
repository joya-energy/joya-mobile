import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { apiClient } from "@/lib/api";
import { openExternalUrl } from "@/lib/files/open-external-url";

export type DownloadedApiFile = {
  uri: string;
  filename: string;
  mimeType: string | undefined;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
};

function parseFilename(disposition: string): string | null {
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      // fall through to plain filename
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1]?.trim() || null;
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]+/g, "_").trim();
  return cleaned || "document";
}

function mimeFromFilename(name: string): string | undefined {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext];
}

/**
 * Authenticated GET (Bearer + refresh handled by apiClient) that stores the
 * binary response in the cache directory. Replaces the web blob + anchor flow.
 */
export async function downloadApiFile(
  path: string,
  fallbackFilename: string,
): Promise<DownloadedApiFile> {
  const response = await apiClient.get<ArrayBuffer>(path, {
    responseType: "arraybuffer",
  });
  const disposition = String(response.headers["content-disposition"] ?? "");
  const filename = sanitizeFilename(
    parseFilename(disposition) ?? fallbackFilename,
  );

  const directory = new Directory(Paths.cache, "joya-downloads");
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  const file = new File(directory, filename);
  if (file.exists) {
    file.delete();
  }
  file.create();
  await file.write(new Uint8Array(response.data));

  return { uri: file.uri, filename, mimeType: mimeFromFilename(filename) };
}

/** Opens the native share sheet (save to Files, open in…, WhatsApp, etc.). */
export async function shareDownloadedFile(
  file: DownloadedApiFile,
): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: file.mimeType,
      dialogTitle: file.filename,
    });
    return;
  }
  await openExternalUrl(file.uri);
}
